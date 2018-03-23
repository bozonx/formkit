const _ = require('lodash');
const Storage = require('./Storage');
const FormStorage = require('./FormStorage');
const FieldStorage = require('./FieldStorage');
const Field = require('./Field');
const { findFieldRecursively, findRecursively, isPromise } = require('./helpers');


module.exports = class Form {
  constructor(config) {
    this._config = config;
    this._storage = new Storage();
    this._formStorage = new FormStorage(this._storage);
    this._fieldStorage = new FieldStorage(this._storage);
    this._fields = {};
    this._validateCb = null;
    this._handlers = {
      onChange: undefined,
      onSubmit: undefined,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
  }

  get fields() {
    return this._fields;
  }

  get values() {
    return this._formStorage.getCombinedValues();
  }

  get savedValues() {
    return this._formStorage.getSavedValues();
  }

  get dirty() {
    // search for dirty values in fields
    return Boolean(findFieldRecursively(this.fields, (field) => {
      return field.dirty;
    }));
  }

  get touched() {
    return this._formStorage.getState('touched');
  }

  /**
   * Returns true if one or more fields are saving.
   */
  get saving() {
    return Boolean(findFieldRecursively(this.fields, (field) => {
      return field.saving;
    }));
  }

  get submitting() {
    return this._formStorage.getState('submitting');
  }

  /**
   * allow/disallow submit. It helpful to use as "disabled" button's attribute.
   * @return {boolean} - true if allows to submit.
   */
  get submittable() {
    return !this.canSubmit();
  }

  get valid() {
    return this._formStorage.getState('valid');
  }

  get config() {
    return this._config;
  }

  get editedValues() {
    return this._formStorage.getEditedValues();
  }

  /**
   * Get all the messages of invalid fields
   * @return {Array} - like [{path: "path.to.field", message: "msg"}, ...]
   */
  get invalidMessages() {
    return this._formStorage.getInvalidMessages();
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
      // TODO: может надо рекурсивно???
      _.each(initialFields, (params, pathToField) => this._initField(pathToField, params || {}));
    }
    else {
      throw new Error(`Bad type of fields param`);
    }

    this.validate();

    this._formStorage.emitStorageEvent('init', this.values, undefined);
  }

  /**
   * Add one or more handlers on form's event:
   * * change - changes made by user
   * * storage - changes of storage
   * * saveStart
   * * saveEnd
   * * submitStart
   * * submitEnd
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    this._formStorage.on(eventName, cb);
  }

  off(eventName, cb) {
    this._formStorage.off(eventName, cb);
  }

  /**
   * Add only one callback of 'change' event. It usefull for use as handler of component.
   * @param {function} handler - your handler
   */
  onChange(handler) {
    this._handlers.onChange = handler;
  }

  onSubmit(handler) {
    this._handlers.onSubmit = handler;
  }

  /**
   * Clear storage and remove all the event handlers
   */
  destroy() {
    this._formStorage.destroy();
  }

  /**
   * Check for ability to form submit.
   * @return {string|undefined} - returns undefined if it's OK else returns a reason.
   */
  canSubmit() {
    // disallow submit invalid form
    if (!this.valid) return `The form is invalid.`;
    // do nothing if form is submitting at the moment
    if (this.submitting) return `The form is submitting now.`;

    if (!this._config.allowSubmitUnchangedForm) {
      if (!this.dirty) return `The form hasn't changed.`;
    }
  }

  /**
   * It can be placed as a handler of <form> element on onSubmit attribute.
   * Please check ability of submission of form by calling `form.canSubmit()` or use submittable param
   * @return {Promise} - wait for submit has finished
   */
  handleSubmit() {
    const { values, editedValues } = this;

    this.$setState({ submitting: true });
    this._formStorage.emit('submitStart', { values, editedValues });

    if (!this._handlers.onSubmit) {
      // if there isn't a submit callback, just finish submit process
      this._afterSubmitSuccess(values);

      return Promise.resolve();
    }

    // run submit callback
    return this._runSubmitHandler(values, editedValues);
  }

  /**
   * Roll back to initial values for all the fields.
   */
  clear() {
    // TODO: вызовится много обработчиков storage event
    findFieldRecursively(this.fields, (field) => field.clear());
  }

  /**
   * Reset values to default values for all the fields.
   */
  reset() {
    // TODO: вызовится много обработчиков storage event
    findFieldRecursively(this.fields, (field) => field.reset());
  }

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert() {
    // TODO: вызовится много обработчиков storage event
    findFieldRecursively(this.fields, (field) => field.revert());
  }

  /**
   * Cancel submitting
   */
  cancelSubmitting() {
    // TODO: add and test
  }

  /**
   * Set callback wich will be called on each validating request.
   * @param {function} cb - callback like (errors, values) => {...}
   */
  setValidateCb(cb) {
    this._validateCb = cb;
    const oldState = this._formStorage.getWholeState();

    this.validate();

    const newState = this._formStorage.getWholeState();
    this._formStorage.emitStorageEvent('update', newState, oldState);
  }

  /**
   * Set form's values silently without rising a "change" event
   * @param {object} newValues - fields' values.
   *                             You can set values all the fields or just to a part of fields.
   */
  setValues(newValues) {
    // TODO: test plain object values
    // TODO: вызовится много обработчиков storage event
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    findRecursively(newValues, (value, path) => {
      const field = _.get(this.fields, path);
      // if it is'n a field - go deeper
      if (!field || !(field instanceof Field)) return;
      // else means it's field - set value and don't go deeper
      // set value to edited layer
      field.setValue(value);

      return false;
    });
  }

  /**
   * Set values to "saved" level and clear current values.
   * It usually runs after saving has successfully done.
   * It needs if you want to rollback user changes to previously saved values.
   * @param newValues
   */
  setSavedValues(newValues) {
    // TODO: test plain object values
    // TODO: вызовится много обработчиков storage event
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    findRecursively(newValues, (value, path) => {
      const field = _.get(this.fields, path);
      // if it is'n a field - go deeper
      if (!field || !(field instanceof Field)) return;
      // else means it's field - set value and don't go deeper
      // set value to saved layer
      field.setSavedValue(value);

      return false;
    });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate() {

    // TODO: не поднимать событие

    if (!this._validateCb) return;

    const errors = {};
    const values = this.values;
    let isFormValid = true;

    // add sub structures to "errors" for easy access to error
    findFieldRecursively(this.fields, (field, path) => {
      const split = path.split('.');
      const minPathItems = 2;
      if (split.length < minPathItems) return;

      split.pop();
      const basePath = split.join();

      _.set(errors, basePath, {});
    });

    // do validate
    this._validateCb(errors, values);

    // set valid state to all the fields
    findFieldRecursively(this.fields, (field, path) => {
      const invalidMsg = _.get(errors, path);
      if (isFormValid) isFormValid = !invalidMsg;

      field.$setStateSilent({ invalidMsg });
    });

    // TODO: review - нужно ли сохранять или просто высчитывать?
    this._formStorage.setState({ valid: isFormValid });
  }

  $getWholeStorageState() {
    return this._storage.getWholeStorageState();
  }

  $setState(partlyState) {
    this._formStorage.setState(partlyState);
  }

  $callHandler(handlerName, data) {
    const formOnChangeHandler = this._handlers[handlerName];

    if (formOnChangeHandler) formOnChangeHandler(data);
  }

  $emit(eventName, data) {
    this._formStorage.emit(eventName, data);
  }

  _runSubmitHandler(values, editedValues) {
    // get result of submit handler
    const returnedValue = this._handlers.onSubmit({ values, editedValues });

    // if handler returns a promise - wait for its fulfilling
    if (isPromise(returnedValue)) {
      return returnedValue
        .then((data) => {
          this._afterSubmitSuccess(values);

          return data;
        })
        .catch((error) => {
          this.$setState({ submitting: false });
          this._formStorage.emit('submitEnd', { error });

          return Promise.reject(error);
        });
    }

    // else if handler returns any other type - don't wait and finish submit process
    this._afterSubmitSuccess(values);

    return Promise.resolve();
  }

  _afterSubmitSuccess(values) {
    this.$setState({ submitting: false });

    // TODO: много поднимется событий storage change !!!

    findFieldRecursively(this.fields, (field, pathToField) => {
      const savedValue = _.get(values, pathToField);
      field.$setSavedValueAfterSubmit(savedValue);
    });

    this._formStorage.emit('submitEnd');
  }

  /**
   * Initialize a field.
   * @param {string} pathToField
   * @param {object} fieldParams - { initial, defaultValue, disabled, validate, debounceTime }
   * @private
   */
  _initField(pathToField, fieldParams) {
    if (!pathToField) throw new Error(`You have to pass a field's name or path!`);
    // Try to get existent field
    const existentField = _.get(this.fields, pathToField);
    if (existentField) throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`);

    // create new one
    const newField = new Field(pathToField, fieldParams, this, this._fieldStorage);
    _.set(this.fields, pathToField, newField);
  }

};
