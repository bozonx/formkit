const _ = require('lodash');
const Storage = require('./Storage');
const FormStorage = require('./FormStorage');
const FieldStorage = require('./FieldStorage');
const Field = require('./Field');
const { findInFieldRecursively, findRecursively, isPromise } = require('./helpers');


module.exports = class Form {
  constructor(config) {
    this._config = config;
    this._storage = new Storage();
    this._formStorage = new FormStorage(this._storage);
    this._fieldStorage = new FieldStorage(this._storage);
    this._fields = {};
    this._validateCb = null;

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

  get saving() {
    return this._formStorage.isSaving();
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
    return this._formStorage.isValid();
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
    if (!this.valid) return Promise.reject(new Error('Form is invalid'));

    return this._formStorage.riseFormDebouncedSave(true);
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
    this._formStorage.cancelSaving();
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
    this._formStorage.flushSaving();
  }

  /**
   * Set form's values without rise a "change event"
   * @param newValues
   */
  setValues(newValues) {
    // TODO: fix - неполучится устанавливать plain object values
    findRecursively(newValues, (value, path) => {
      const field = _.get(this.fields, path);
      if (!field || !(field instanceof Field)) return;
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
    // TODO: какая туту стратегия - полностью заменяем или обновляем???
    findRecursively(this.fields, (field, path) => {
      const value = _.get(newValues, path);
      field.setSavedValue(value);
    });
    // findRecursively(newValues, (value, path) => {
    //   const field = _.get(this.fields, path);
    //   if (!field || !(field instanceof Field)) return;
    //   field.setSavedValue(value);
    // });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate() {
    if (!this._validateCb) return;

    const errors = {};
    const values = {};

    // add sub structures for easy access to error
    findRecursively(this.fields, (field, path) => {
      _.set(values, path, field.value);

      const split = path.split('.');
      if (split.length < 2) return;

      split.pop();
      const basePath = split.join();

      _.set(errors, basePath, {});
    });

    this._validateCb(errors, values);

    findRecursively(this.fields, (field, path) => {
      //const field = _.get(this.fields, path);
      if (!field || !(field instanceof Field)) return;

      const errorMsg = _.get(errors, path);
      field.$setValidState(errorMsg);
    });

  }

  $setState(partlyState) {
    this._formStorage.setState(partlyState);
  }

  $getWholeStorageState() {
    return this._storage.getWholeStorageState();
  }

  $startDebounceSave(force) {
    // TODO: !!!!!! see riseFormDebouncedSave
  }

  $getHandler(handlerName) {
    // TODO: get srom formStorage
  }

  $emit(eventName, data) {
    // TODO: call formStorage.emit
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
      // TODO: review
      this._storage.setAllSavedValues(values);
      // update all the dirty states
      // TODO: review
      findInFieldRecursively(this.fields, (field) => {
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

};
