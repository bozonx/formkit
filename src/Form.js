const _ = require('lodash');
const Storage = require('./Storage');
const FormStorage = require('./FormStorage');
const FieldStorage = require('./FieldStorage');
const Field = require('./Field');
const DebouncedCall = require('./DebouncedCall');
const { findFieldRecursively, findRecursively, isPromise } = require('./helpers');


module.exports = class Form {
  constructor(config) {
    this._config = config;
    this._storage = new Storage();
    this._formStorage = new FormStorage(this._storage);
    this._fieldStorage = new FieldStorage(this._storage);
    this._fields = {};
    this._validateCb = null;
    this._saveDebouncedCall = new DebouncedCall(this._config.debounceTime);
    this._handlers = {
      onChange: undefined,
      onSave: undefined,
      onSubmit: undefined,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
    /this._doSave = this._doSave.bind(this);
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
  get submittable() {
    return !this.canSubmit();
  }

  get valid() {
    return this._formStorage.getState('valid');
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
    this._handlers.onChange = handler;
  }

  onSave(handler) {
    this._handlers.onSave = handler;
  }

  onSubmit(handler) {
    this._handlers.onSubmit = handler;
  }

  /**
   * Check for ability to save form.
   * @return {string|undefined} - returns undefined if it's OK else returns a reason.
   */
  canSave() {
    if (!this.valid) return 'Form is invalid';
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
    const values = this._formStorage.getValues();

    this.$setState({ submitting: true });
    this._formStorage.emit('submitStart', values);

    if (!this._handlers.onSubmit) {
      // if there isn't a submit callback, just finish submit process
      this._afterSubmitSuccess(values);

      return Promise.resolve(values);
    }

    // run submit callback
    return this._runSubmitHandler(values);
  }

  /**
   * Recalculate dirty state.
   */
  $recalcDirty() {
    // search for dirty values in fields
    const hasAnyDirty = findFieldRecursively(this.fields, (field) => {
      if (field.dirty) return true;
    });
    this._formStorage.setState({ dirty: !!hasAnyDirty });
  }

  /**
   * Start form save immediately.
   * @return {Promise}
   */
  save() {

    // TODO: review - why save form ???

    if (!this.savable) return Promise.resolve();

    return this._riseFormDebouncedSave(true);
  }

  /**
   * Roll back to initial values for all the fields.
   */
  clear() {
    findFieldRecursively(this.fields, (field) => field.clear());
  }

  /**
   * Reset values to default values for all the fields.
   */
  reset() {
    findFieldRecursively(this.fields, (field) => field.reset());
  }

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert() {
    findFieldRecursively(this.fields, (field) => field.revert());
  }

  /**
   * Cancel saving
   */
  cancelSaving() {
    // TODO: test
    this._saveDebouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._saveDebouncedCall.flush();
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
    let isFormValid = true;

    // add sub structures to "errors" for easy access to error
    findFieldRecursively(this.fields, (field, path) => {
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
    findFieldRecursively(this.fields, (field, path) => {
      const errorMsg = _.get(errors, path);
      if (isFormValid) isFormValid = !errorMsg;

      field.$setValidState(errorMsg);
    });

    this._formStorage.setState({ valid: isFormValid });
  }

  $getWholeStorageState() {
    return this._storage.getWholeStorageState();
  }

  $setState(partlyState) {
    this._formStorage.setState(partlyState);
  }

  $startDebounceSave(isImmediately) {
    this._riseFormDebouncedSave(isImmediately);
  }

  $callHandler(handlerName, data) {
    const formOnChangeHandler = this._handlers[handlerName];

    if (formOnChangeHandler) formOnChangeHandler(data);
  }

  $emit(eventName, data) {
    this._formStorage.emit(eventName, data);
  }


  _riseFormDebouncedSave(isImmediately) {
    return this._saveDebouncedCall.exec(this._doSave, isImmediately);
  }
  //
  // _doSave(data, saveCb, setSavingState, riseEvent) {
  //
  //   // this._storage.getUnsavedValues(),
  //   //   // TODO: review
  //   //   this._formCallbacks.save,
  //   //   // TODO: setState неправильно используется
  //   //   (...p) => this.$setState('saving', ...p),
  //   //   (...p) => this._riseFormEvent(...p),
  //
  //   // TODO: !!!!! review
  //
  //   // set saving: true
  //   this.$setState({ saving: true });
  //   // rise saveStart event
  //   riseEvent('saveStart', data);
  //
  //   const saveEnd = () => {
  //     // set saving: false
  //     this.$setState({ saving: false });
  //     // rise saveEnd
  //     riseEvent('saveEnd');
  //   };
  //
  //   if (saveCb) {
  //     // run save callback
  //     const cbPromise = saveCb(data);
  //     if (isPromise(cbPromise)) {
  //       return cbPromise.then(() => saveEnd(), (error) => {
  //         this.$setState({ saving: false });
  //         riseEvent('saveEnd', { error });
  //
  //         return Promise.reject(error);
  //       });
  //     }
  //
  //     // if save callback hasn't returned a promise
  //     saveEnd();
  //   }
  //   else {
  //     // if there isn't save callback
  //     saveEnd();
  //   }
  // }

  _runSubmitHandler(values) {
    const returnedValue = this._handlers.onSubmit(values);

    // if cb returns a promise - wait for its fulfilling
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
      findFieldRecursively(this.fields, (field, pathToField) => {
        // set value to saved value layer and clear top layer
        field.setValue( _.get(values, pathToField) );
        field.$recalcDirty();
      });
    }
    // recalc dirty state of form
    // TODO: ??? why???
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
