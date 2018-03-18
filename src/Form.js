const _ = require('lodash');
const Storage = require('./Storage');
const FormStorage = require('./FormStorage');
const FieldStorage = require('./FieldStorage');
const Field = require('./Field');
const DebouncedCall = require('./DebouncedCall');
const { findInFieldRecursively, findRecursively, isPromise } = require('./helpers');


module.exports = class Form {
  constructor(config) {
    this._config = config;
    this._storage = new Storage();
    this._formStorage = new FormStorage(this._storage);
    this._fieldStorage = new FieldStorage(this._storage);
    this._fields = {};
    this._validateCb = null;
    this._formSaveDebouncedCall = new DebouncedCall(this._config.debounceTime);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
  }

  get fields() {
    return this._fields;
  }

  get values() {
    return this._formStorage.getValues();
  }

  get savedValues() {
    return this._formStorage.getSavedValues();
  }

  get dirty() {
    return this._formStorage.getState('dirty');
  }

  get touched() {
    return this._formStorage.getState('touched');
  }

  /**
   * Returns true if form or one or more of its field is saving.
   */
  get saving() {
    return this._formStorage.getState('saving');

    // TODO: test - saving у формы должен проставляться при сохранении поля
  }

  get submitting() {
    return this._formStorage.getState('submitting');
  }

  /**
   * allow/disallow submit. It helpful to use as "disabled" button's attribute.
   * @return {boolean} - true if allows to submit.
   */
  get submitable() {
    return this.valid && !this.submitting;
  }

  get valid() {
    return this._formStorage.getState('valid');
    // TODO: test - valid у формы должен проставляться при валидации
  }

  get config() {
    return this._config;
  }

  get unsavedValues() {
    return this._formStorage.getUnsavedValues();
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

  /**
   * Add only one callback of 'change' event. It usefull for use as handler of component.
   * @param {function} handler - your handler
   */
  onChange(handler) {
    this._formStorage.setHandler('change', handler);
  }

  onSave(handler) {
    this._formStorage.setHandler('save', handler);
  }

  onSubmit(handler) {
    this._formStorage.setHandler('submit', handler);
  }


  /**
   * It can be placed as a handler of <form> element on onSubmit attribute.
   * @return {Promise} - wait for submit has finished
   */
  handleSubmit() {
    // disallow submit invalid form
    // TODO: review - why reject ???
    if (!this.valid) return Promise.reject(new Error(`The form is invalid`));
    // do nothing if form is submitting at the moment
    // TODO: review - why reject ???
    if (this._formStorage.getState('submitting')) return Promise.reject(new Error(`The form is submitting now.`));

    if (!this._config.allowSubmitUnchangedForm) {
      // TODO: review - why reject ???
      if (!this._formStorage.getState('dirty')) return Promise.reject(new Error(`The form hasn't changed`));
    }

    return this._runSubmitProcess();
  }

  /**
   * Recalculate dirty state.
   */
  $recalcDirty() {
    // search for dirty values in fields
    const hasAnyDirty = findInFieldRecursively(this.fields, (field) => {
      if (field.dirty) return true;
    });
    this._formStorage.setState({ dirty: !!hasAnyDirty });
  }

  /**
   * Start form save immediately.
   * @return {Promise}
   */
  save() {
    // TODO: review - why reject ???
    if (!this.valid) return Promise.reject(new Error('Form is invalid'));

    return this._riseFormDebouncedSave(true);
  }

  /**
   * Roll back to initial values for all the fields.
   */
  clear() {
    findInFieldRecursively(this.fields, (field) => field.clear());
  }

  /**
   * Reset values to default values for all the fields.
   */
  reset() {
    findInFieldRecursively(this.fields, (field) => field.reset());
  }

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert() {
    findInFieldRecursively(this.fields, (field) => field.revert());
  }

  /**
   * Cancel saving
   */
  cancelSaving() {
    // TODO: test
    this._formSaveDebouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._formSaveDebouncedCall.flush();
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
    this.validate();
  }

  /**
   * Set form's values without rising a "change event"
   * @param {object} newValues - fields values.
   *                             You can set values all the fields or just to a part of fields.
   */
  setValues(newValues) {
    // TODO: test plain object values
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    findRecursively(newValues, (value, path) => {
      const field = _.get(this.fields, path);
      // if it is'n a field - go deeper
      if (!field || !(field instanceof Field)) return;
      // else means it's field - set value and don't go deeper
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
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    findRecursively(newValues, (value, path) => {
      const field = _.get(this.fields, path);
      // if it is'n a field - go deeper
      if (!field || !(field instanceof Field)) return;
      // else means it's field - set value and don't go deeper
      field.setSavedValue(value);

      return false;
    });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate() {
    if (!this._validateCb) return;

    const errors = {};
    const values = {};

    // add sub structures to "errors" for easy access to error
    findInFieldRecursively(this.fields, (field, path) => {
      _.set(values, path, field.value);

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
    findInFieldRecursively(this.fields, (field, path) => {
      const errorMsg = _.get(errors, path);
      field.$setValidState(errorMsg);
    });
  }

  $getWholeStorageState() {
    return this._storage.getWholeStorageState();
  }

  $setState(partlyState) {
    this._formStorage.setState(partlyState);
  }

  $startDebounceSave(force) {
    // TODO: !!!!!! see riseFormDebouncedSave
  }

  $callHandler(handlerName, data) {
    const formOnChangeHandler = this._formStorage.getHandler(handlerName);
    if (formOnChangeHandler) formOnChangeHandler(data);
  }

  $emit(eventName, data) {
    this._formStorage.emit(eventName, data);
  }


  _runSubmitProcess() {
    const values = this._formStorage.getValues();

    this.$setState({ submitting: true });
    this._formStorage.emit('submitStart', values);

    if (!this._formStorage.getHandler('submit')) {
      // if there isn't a submit callback, just finish submit process
      this._afterSubmitSuccess(values);

      return Promise.resolve(values);
    }

    // run submit callback
    return this._runSubmitHandler(values);
  }

  _runSubmitHandler(values) {
    const returnedValue = this._formStorage.getHandler('submit')(values);

    // if cb returns a promise - wait for its fulfilling
    if (isPromise(returnedValue)) {
      return returnedValue
        .then((data) => {
          this._afterSubmitSuccess(values);

          return data;
        })
        .catch((error) => {
          this.setState({ submitting: false });
          this._formStorage.emit('submitEnd', { error });

          return Promise.reject(error);
        });
    }
    else {
      // else if cb returns any other types - don't wait and finish submit process
      this._afterSubmitSuccess(values);

      return Promise.resolve(values);
    }
  }

  _afterSubmitSuccess(values) {
    this.$setState({ submitting: false });

    if (this.config.allowUpdateSavedValuesAfterSubmit) {
      // TODO: много поднимется событий sotrage change !!!
      // TODO: test
      findInFieldRecursively(this.fields, (field, pathToField) => {
        // set value to saved value layer and clear top layer
        field.setValue( _.get(values, pathToField) );
        field.$recalcDirty();
      });
    }
    // recalc dirty state of form
    this.$recalcDirty();

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

  _riseFormDebouncedSave(force) {
    // TODO: что за $startSaving ???
    return this._formSaveDebouncedCall.exec(() => this.$startSaving(
      this._storage.getUnsavedValues(),
      // TODO: review
      this._formCallbacks.save,
      // TODO: setState неправильно используется
      (...p) => this.setState('saving', ...p),
      (...p) => this._riseFormEvent(...p),
    ), force);
  }

};
