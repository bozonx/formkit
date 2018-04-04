const _ = require('lodash');
const Storage = require('./Storage');
const FormStorage = require('./FormStorage');
const FieldStorage = require('./FieldStorage');
const Field = require('./Field');
const DebouncedCall = require('./helpers/DebouncedCall');
const { findFieldRecursively, findRecursively, isPromise, isFieldSchema } = require('./helpers/helpers');


module.exports = class Form {
  constructor(config) {
    this._config = config;
    this._debouncedSave = new DebouncedCall(this._config.debounceTime);
    this._storage = new Storage();
    this._formStorage = new FormStorage(this._storage);
    this._fieldStorage = new FieldStorage(this._storage);
    this._fields = {};
    this._validateCb = null;
    this._submitPromise = null;
    this._handlers = {
      onSubmit: undefined,
      onSave: undefined,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
    this._doSave = this._doSave.bind(this);
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

  get editedValues() {
    return this._formStorage.getEditedValues();
  }

  get unsavedValues() {
    return this._formStorage.getUnSavedValues();
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
    return this._formStorage.getState('saving');
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

  get savable() {
    return !this.canSave();
  }

  get valid() {
    return this._formStorage.getState('valid');
  }

  get config() {
    return this._config;
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
      // read schema
      findRecursively(initialFields, (item, path) => {
        if (!_.isPlainObject(item)) return false;

        // means field
        if (_.isEmpty(item) || isFieldSchema(item) ) {
          this._initField(path, item);

          // don't go deeper
          return false;
        }
      });
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

  onSubmit(handler) {
    this._handlers.onSubmit = handler;
  }

  onSave(handler) {
    this._handlers.onSave = handler;
  }


  /**
   * Start saving of form immediately.
   * @return {Promise}
   */
  save() {
    const isImmediately = true;
    return this._startSaving(isImmediately);
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
   * Check for field can be saved.
   * @return {string|undefined} - undefined means it can. Otherwise it returns a reason.
   */
  canSave() {
    // disallow save invalid form
    if (!this.valid) return `The form is invalid.`;
    if (!this.touched) return `The form hasn't been modified`;
  }

  /**
   * It can be placed as a handler of <form> element on onSubmit attribute.
   * Please check ability of submission of form by calling `form.canSubmit()` or use submittable param
   * @return {Promise|undefined} - wait for submit has finished
   */
  handleSubmit() {
    if (!this._handlers.onSubmit) return;

    const { values, editedValues } = this;
    this._setState({ submitting: true });
    this.$emit('submitStart', { values, editedValues });

    // run submit callback
    this._submitPromise = this._runSubmitHandler(values, editedValues);
    this._submitPromise
      .then((data) => {
        this._submitPromise = null;

        return data;
      })
      .catch((err) => {
        this._submitPromise = null;

        return Promise.reject(err);
      });

    return this._submitPromise;
  }

  /**
   * Roll back to initial values for all the fields.
   */
  clear() {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field) => field.$clearSilent());
    });
  }

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert() {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field) => field.$revertSilent());
    });
  }

  /**
   * Reset values to default values for all the fields.
   */
  reset() {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field) => field.$resetSilent());
    });
  }

  /**
   * Clear storage and remove all the event handlers
   */
  destroy() {
    this._handlers = {};

    this.flushSaving();

    const doDestroy = () => {
      findFieldRecursively(this.fields, (field) => {
        return field.$destroyHandlers();
      });

      this._formStorage.destroy();
    };

    // wait for save and submit process have finished
    Promise.all([
      this._debouncedSave.getPromise() || Promise.resolve(),
      this._submitPromise || Promise.resolve(),
    ])
      .then(doDestroy)
      .catch(doDestroy);
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving() {
    this._debouncedSave.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._debouncedSave.flush();
  }

  /**
   * Set callback wich will be called on each validating request.
   * @param {function} cb - callback like (errors, values) => {...}
   */
  setValidateCb(cb) {
    this._validateCb = cb;

    this._updateStateAndValidate();
  }

  /**
   * Set form's values silently without rising a "change" event
   * @param {object} newValues - fields' values.
   *                             You can set values all the fields or just to a part of fields.
   */
  setValues(newValues) {
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    this._updateStateAndValidate(() => {
      findRecursively(newValues, (value, path) => {
        const field = _.get(this.fields, path);
        // if it is'n a field - go deeper
        if (!field || !(field instanceof Field)) {
          if (_.isPlainObject(value)) {
            // go deeper
            return;
          }

          // stop
          return false;
        }
        // else means it's field - set value and don't go deeper
        // set value to edited layer
        field.$setEditedValueSilent(value);

        return false;
      });
    });
  }

  /**
   * Set values to "saved" level and clear current values.
   * It usually runs after saving has successfully done.
   * It needs if you want to rollback user changes to previously saved values.
   * @param newValues
   */
  setSavedValues(newValues) {
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    this._updateStateAndValidate(() => {
      findRecursively(newValues, (value, path) => {
        const field = _.get(this.fields, path);

        // if it is'n a field - go deeper
        if (!field || !(field instanceof Field)) {
          if (_.isPlainObject(value)) {
            // go deeper
            return;
          }

          // stop
          return false;
        }
        // else means it's field - set value and don't go deeper
        // set value to saved layer
        field.$setSavedValue(value);

        return false;
      });
    });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate() {
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
      const invalidMsg = _.get(errors, path) || null;
      if (isFormValid) isFormValid = !invalidMsg;

      field.$setStateSilent({ invalidMsg });
    });

    this._formStorage.setStateSilent({ valid: isFormValid });
  }

  $getWholeStorageState() {
    return this._storage.getWholeStorageState();
  }

  $setStateSilent(partlyState) {
    this._formStorage.setStateSilent(partlyState);
  }

  $handleFieldChange(eventData) {
    // run form's change event
    this.$emit('change', eventData);

    const isImmediately = false;
    this._startSaving(isImmediately);
  }

  _startSaving(isImmediately) {
    // don't run saving process if there isn't onSave callback
    if (!this._handlers.onSave) return;

    const valuesBeforeSave = this.values;

    this._debouncedSave.exec(this._doSave, isImmediately);
    this._debouncedSave.onEnd((error) => {
      if (error) {
        this._setState({ saving: false });
        this.$emit('saveEnd', { error });
      }
      else {
        const force = true;
        this.$setStateSilent({ saving: false });
        this._moveValuesToSaveLayer(valuesBeforeSave, force);
        this.$emit('saveEnd');
      }
    });

    return this._debouncedSave.getPromise();
  }

  $emit(eventName, data) {
    this._formStorage.emit(eventName, data);
  }

  _doSave() {
    this._setState({ saving: true });
    // emit save start
    this.$emit('saveStart');

    // run save callback
    const cbResult = this._handlers.onSave(this.values);

    if (isPromise(cbResult)) {
      return cbResult;
    }

    // else if save callback hasn't returned a promise

    return Promise.resolve();
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
          this._setState({ submitting: false });
          this.$emit('submitEnd', { error });

          return Promise.reject(error);
        });
    }

    // else if handler returns any other type - don't wait and finish submit process
    this._afterSubmitSuccess(values);

    return Promise.resolve();
  }

  _afterSubmitSuccess(values) {
    this._setState({ submitting: false });
    this._moveValuesToSaveLayer(values);
    this.$emit('submitEnd');
  }

  _moveValuesToSaveLayer(values, force) {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field, pathToField) => {
        const savedValue = _.get(values, pathToField);
        field.$setValueAfterSave(savedValue);
      });
    }, force);
  }

  /**
   * Initialize a field.
   * @param {string} pathToField
   * @param {object} fieldParams - { initial, defaultValue, disabled, validate, debounceTime }
   * @private
   */
  _initField(pathToField, fieldParams) {
    if (!pathToField) throw new Error(`You have to specify a field's name!`);
    // Try to get existent field
    const existentField = _.get(this.fields, pathToField);
    if (existentField) throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`);

    // create new one
    const newField = new Field(pathToField, fieldParams, this, this._fieldStorage);
    _.set(this.fields, pathToField, newField);
  }

  _setState(partlyState) {
    this._updateState(() => {
      this._formStorage.setStateSilent(partlyState);
    });
  }

  _updateStateAndValidate(cbWhichChangesState, force) {
    this._updateState(() => {
      if (cbWhichChangesState) cbWhichChangesState();
      this.validate();
    }, force);
  }

  _updateState(cbWhichChangesState, force) {
    const oldState = this._formStorage.getWholeState();

    if (cbWhichChangesState) cbWhichChangesState();

    const newState = this._formStorage.getWholeState();
    this._formStorage.emitStorageEvent('update', newState, oldState, force);
  }

};
