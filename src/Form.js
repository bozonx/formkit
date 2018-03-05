const _ = require('lodash');
const Storage = require('./Storage');
const Events = require('./Events');
const State = require('./State');
const Field = require('./Field');
const { findInFieldRecursively, findRecursively, parseValidateCbReturn } = require('./helpers');


module.exports = class Form {
  constructor(config, eventEmitter) {
    this._config = config;
    this._fields = {};
    this._validateCb = null;
    this._storage = new Storage();
    this._state = new State(this, this._storage);
    this._events = new Events(this, eventEmitter, this._storage, this._state);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
  }

  get fields() {
    return this._fields;
  }
  get values() {
    return this._storage.getFormValues();
  }
  get savedValues() {
    return this._storage.getFormSavedValues();
  }
  get dirty() {
    return this._storage.getFormState('dirty');
  }
  get touched() {
    return this._storage.getFormState('touched');
  }
  get saving() {
    return this._storage.getFormSaving();
  }
  get submitting() {
    return this._storage.getFormState('submitting');
  }

  /**
   * allow/disallow submit. It helpful to use as "disabled" button's attribute.
   * @return {*}
   */
  get submitable() {
    return this.valid && !this.submitting;
  }
  get valid() {
    return this._storage.getFormValid();
  }
  get config() {
    return this._config;
  }
  get unsavedValues() {
    return this._storage.getFormUnsavedValues();
  }

  /**
   * Get all messages of invalid fields
   * @return {Array} like [{path: "path.to.field", message: "msg"}, ...]
   */
  get invalidMessages() {
    const invalidMessages = [];
    findInFieldRecursively(this.fields, (field) => {
      if (!field.valid && field.invalidMsg) {
        invalidMessages.push({ path: field.path, message: field.invalidMsg });
      }
    });

    return invalidMessages;
  }

  /**
   * It calls from outer app's code to init form.
   * @param {array|object} initialFields
   *   * if array: you can pass just fields name like: ['id', 'title', 'body']
   *   * if object: you can pass a fields config like: {name: {default: 'no name', ...}}
   * @param {function} validateCb - function which will be called on each change to validate form
   */
  init(initialFields, validateCb) {
    this._validateCb = validateCb;

    if (_.isArray(initialFields)) {
      _.each(initialFields, (pathToField) => this._initField(pathToField, {}));
    }
    else if (_.isPlainObject(initialFields)) {
      _.each(initialFields, (params, pathToField) => this._initField(pathToField, params || {}));
    }
    else {
      throw new Error(`Bad type of field's param`);
    }
  }

  /**
   * Add one or more handlers on form's event:
   * * change
   * * silentChange
   * * anyChange
   * * saveStart
   * * saveEnd
   * * submitStart
   * * submitEnd
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    this._events.addFormListener(eventName, cb);
  }

  /**
   * Add only one callback of 'change' event. It usefull for use as handler of component.
   * @param {function} cb
   */
  onChange(cb) {
    this._events.setFormCallback('change', cb);
  }

  onSave(cb) {
    this._events.setFormCallback('save', cb);
  }

  onSubmit(cb) {
    this._events.setFormCallback('submit', cb);
  }


  /**
   * It can be placed ad a handler of <form> element on onSubmit attribute.
   * @return {Promise}
   */
  handleSubmit() {
    // disallow submit invalid form
    if (!this.valid) return Promise.reject(new Error(`The form is invalid`));
    // do nothing if form is submitting at the moment
    if (this._storage.getFormState('submitting')) return Promise.reject(new Error(`The form is submitting now.`));

    if (!this._config.allowSubmitUnchangedForm) {
      if (!this._storage.getFormState('dirty')) return Promise.reject(new Error(`The form hasn't changed`));
    }

    const values = _.clone(this._storage.getFormValues());

    return this._events.riseFormSubmit(values);
  }

  /**
   * Start form save immediately.
   * @return {Promise}
   */
  save() {
    if (!this.valid) return Promise.reject(new Error('Form is invalid'));

    return this._events.riseFormDebouncedSave(true);
  }

  /**
   * Roll back to previously saved values.
   */
  clear() {
    findInFieldRecursively(this.fields, (field) => field.clear());
  }

  /**
   * Reset values to default values.
   */
  reset() {
    findInFieldRecursively(this.fields, (field) => field.reset());
  }

  /**
   * Cancel saving
   */
  cancelSaving() {
    // TODO: test
    this._events.cancelFormSaving();
  }

  /**
   * Cancel submitting
   */
  cancelSubmitting() {
    // TODO: add and test
  }

  setValidateCb(cb) {
    this._validateCb = cb;
    this.validate();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._events.flushFormSaving();
  }

  /**
   * Set form's values without rise a "change event"
   * @param newValues
   */
  setValues(newValues) {
    findRecursively(newValues, (value, path) => {
      const field = _.get(this.fields, path);
      if (!field || !field.constructor || field.constructor.name !== 'Field') return;
      field.setValue(value);
    });
  }

  /**
   * Set values to "saved" level and update current values.
   * It usually runs after saving has successfully done.
   * It needs if you want to rollback user changes to previously saved values.
   * @param newValues
   */
  setSavedValues(newValues) {
    findRecursively(newValues, (value, path) => {
      const field = _.get(this.fields, path);
      if (!field || !field.constructor || field.constructor.name !== 'Field') return;
      field.setSavedValue(value);
    });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate() {
    if (!this._validateCb) return;

    const errors = {};

    // add sub structures for easy access to error
    findRecursively(this.fields, (value, path) => {
      const split = path.split('.');
      if (split.length < 2) return;

      split.pop();
      const basePath = split.join();

      _.set(errors, basePath, {});
    });

    this._validateCb(errors, this.values);

    findRecursively(errors, (value, path) => {
      const field = _.get(this.fields, path);
      if (!field || !field.constructor || field.constructor.name !== 'Field') return;
      field.$setValidState(value);
    });

    // if (cbReturn === '') throw new Error(`Validate callback returns an empty string, what does it mean?`);
    //
    // const { valid, invalidMsg, result } = parseValidateCbReturn(cbReturn);
    //
    // this._storage.setFieldState(this._pathToField, {
    //   valid,
    //   invalidMsg,
    // });
    //
    // return result;
  }

  // setValidators(validators) {
  //
  //   // TODO: review
  //
  //   if (!_.isPlainObject(validators)) throw new Error(`ERROR: setValidators: Bad type of config`);
  //
  //   const recursively = (container, fields) => {
  //     _.each(container, (item, name) => {
  //       if (_.isFunction(item)) {
  //         fields[name].setValidateCb(item);
  //       }
  //       else if (_.isPlainObject(item)) {
  //         // go deeper
  //         recursively(item, fields[name]);
  //       }
  //       else {
  //         throw new Error(`ERROR: setValidators: Bad type of config`);
  //       }
  //     });
  //   };
  //
  //   recursively(validators, this.fields);
  // }

  $getWholeStorageState() {
    return this._storage.getWholeStorageState();
  }


  /**
   * Initialize a field.
   * @param pathToField
   * @param {object} params - { initial, defaultValue, disabled, validate, debounceTime }
   * @private
   */
  _initField(pathToField, params) {
    if (!pathToField) throw new Error(`You must pass a field's name or path!`);
    // Try to get existent field
    const existentField = _.get(this.fields, pathToField);
    if (existentField) throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`);

    // create new one
    const newField = new Field(pathToField, params, {
      form: this,
      events: this._events,
      storage: this._storage,
      state: this._state,
    });
    _.set(this.fields, pathToField, newField);
  }

};
