const _ = require('lodash');
const DebouncedCall = require('./DebouncedCall');
const { calculateDirty, getFieldName, isPromise } = require('./helpers');


module.exports = class Field {
  constructor(pathToField, params, { form, fieldStorage }) {
    this._form = form;
    this._fieldStorage = fieldStorage;
    // TODO: may be move to events?
    this._debouncedCall = new DebouncedCall(this._form.config.debounceTime);
    if (!_.isUndefined(params.debounceTime)) this.setDebounceTime(params.debounceTime);

    this._pathToField = pathToField;
    this._fieldName = getFieldName(pathToField);

    this._initState(params);

    this.handleChange = this.handleChange.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handlePressEnter = this.handlePressEnter.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
    this._startSaving = this._startSaving.bind(this);
  }

  get form() {
    return this._form;
  }
  get savedValue() {
    return this._fieldStorage.getState(this._pathToField, 'savedValue');
  }

  /**
   * Current value
   * @return {*}
   */
  get value() {
    return this._fieldStorage.getValue(this._pathToField);
  }
  get name() {
    return this._fieldName;
  }
  get path() {
    return this._pathToField;
  }
  get dirty() {
    return this._fieldStorage.getState(this._pathToField, 'dirty');
  }
  get touched() {
    return this._fieldStorage.getState(this._pathToField, 'touched');
  }
  get valid() {
    return this._fieldStorage.getState(this._pathToField, 'valid');
  }
  get invalidMsg() {
    return this._fieldStorage.getState(this._pathToField, 'invalidMsg');
  }
  get saving() {
    return this._fieldStorage.getState(this._pathToField, 'saving');
  }
  get focused() {
    return this._fieldStorage.getState(this._pathToField, 'focused');
  }
  get disabled() {
    return this._fieldStorage.getState(this._pathToField, 'disabled');
  }
  get defaultValue() {
    return this._fieldStorage.getState(this._pathToField, 'defaultValue');
  }
  get debounceTime() {
    return this._debouncedCall.delay;
  }

  /**
   * Set value silently(don't rise a change event).
   * It does:
   * * It set a new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises storageChange event.
   *
   * It doesn't:
   * * It doesn't rise onChange callback (for user's events).
   * * It doesn't update "touched" state.
   * @param newValue
   */
  setValue(newValue) {
    this._setValueProcess(newValue);
  }

  /**
   * Set previously saved value. Usually it sets after server data has loading.
   * @param {*} newSavedValue
   */
  setSavedValue(newSavedValue) {
    // set saved value
    this._fieldStorage.setState(this._pathToField, { savedValue: newSavedValue });

    // TODO: лучше устанавливать в любом случае, а вот очищать state level только если поле не под фокусом

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this._form.config.allowFocusedFieldUpdating || (!this._form.config.allowFocusedFieldUpdating && !this.focused)) {
      this.setValue(newSavedValue);
    }
  }

  setDisabled(value) {
    if (!_.isBoolean(value)) throw new Error(`Disabled has to be boolean`);
    this._fieldStorage.setState(this._pathToField, { disabled: value });
  }

  setDebounceTime(delay) {
    const toNumber = _.toNumber(delay);
    if (_.isNull(toNumber) || _.isNaN(toNumber)) throw new Error(`Bad debounceTime value`);
    // TODO: doesn't work
    this._debouncedCall.delay = toNumber;
  }


  /**
   * It's an onChange handler. It has to be placed to input's onChange attribute.
   * It sets a new value made by user and start saving.
   * It does:
   * * don't do anything if field is disabled
   * * don't save if value isn't changed
   * * update value
   * * update "touched" and "dirty" states
   * * validate form
   * * Rise a "change" events for field and form
   * * Run an onChange callback if it assigned.
   * * Start saving
   * @param {*} newValue
   */
  handleChange(newValue) {
    // don't do anything if disabled
    if (this.disabled) return;

    const oldValue = _.cloneDeep(this.value);
    const isChanged = !_.isEqual(oldValue, newValue);

    if (isChanged) {
      // set value, dirty state and validate
      this._setValueProcess(newValue);

      // set touched to true
      if (!this.touched) {
        this._fieldStorage.setState(this._pathToField, { touched: true });
        this._form.setState({ touched: true });
      }
    }

    // rise change event and save only changed value
    if (!this._form.config.allowSaveUnmodifiedField && !isChanged) return;

    // rise change by user event handlers and callbacks of form and field
    this._riseUserChangeEvent(this._pathToField, oldValue, newValue);
    // start save with debounced delay
    this._addSavingToQueue(false);
  }

  /**
   * Set field's "focused" prop to true.
   */
  handleFocusIn() {
    this._fieldStorage.setState(this._pathToField, { focused: true });
  }

  /**
   * Set field's "focused" prop to false.
   */
  handleBlur() {
    this._fieldStorage.setState(this._pathToField, { focused: false });
    // start save immediately
    this.save();
  }

  /**
   * bind it to your component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handlePressEnter() {
    if (this.disabled) return;
    // start save immediately
    this.save();
  }

  /**
   * Add one or more handlers on fields's event:
   * * change
   * * silentChange
   * * anyChange
   * * saveStart
   * * saveEnd
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    this._fieldStorage.on(this._pathToField, eventName, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user.
   * @param {function} handler - callback. You can set only one callback per field.
   */
  onChange(handler) {
    this._fieldStorage.setHandler(this._pathToField, 'onChange', handler);
  }

  /**
   * It rises with debounce delay on start saving.
   * @param {function} handler - callback. If it returns a promise - saving process will wait for it.
   *                             You can set only one callback per field.
   */
  onSave(handler) {
    this._fieldStorage.setHandler(this._pathToField, 'onSave', handler);
  }

  /**
   * Start saving of field's value immediately.
   * @return {Promise}
   */
  save() {
    return this._addSavingToQueue(true);
  }

  /**
   * Clear value(user input) and set initial value.
   */
  clear() {
    // TODO: test
    this.setValue(this._fieldStorage.getState(this._pathToField, 'initial'));
  }

  /**
   * set saved value to current value.
   */
  revert() {
    // TODO: test
    this.setValue(this.savedValue);
  }

  /**
   * Reset to default value
   */
  reset() {
    this.setValue(this.defaultValue);
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving() {
    this._debouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._debouncedCall.flush();
  }

  /**
   * It calls from form after validating.
   * @param {string|undefined} invalidMsg - invalid message of undefined
   */
  $setValidState(invalidMsg) {
    this._fieldStorage.setState(this._pathToField, {
      valid: _.isUndefined(invalidMsg),
      invalidMsg,
    });
  }

  /**
   * Recalculate dirty state.
   */
  $recalcDirty() {
    // TODO: review
    this._fieldStorage.setFieldAndFormDirty(
      this._pathToField,
      calculateDirty(this.value, this.savedValue)
    );
  }


  /**
   * Init field state.
   * @param {object} params - params which was passed to form init.
   * @private
   */
  _initState(params) {
    const initialState = {
      disabled: params.disabled,
      defaultValue: params.defaultValue,
      initial: params.initial,
    };
    // set initial value otherwise default value
    const newValue = (_.isUndefined(params.initial)) ? params.defaultValue : params.initial;

    // init state
    this._fieldStorage.initState(this._pathToField, initialState);

    if (!_.isUndefined(newValue)) {
      this._fieldStorage.setValue(this._pathToField, newValue);
      this.form.validate();
    }
  }

  /**
   * Start saving field and form in they have a save handlers.
   * It will reset saving in progress before start saving.
   * @param {boolean} force
   *   * if true it will save immediately.
   *   * if false it will save with dobounce delay
   * @private
   * @return {Promise}
   */
  _addSavingToQueue(force) {
    // don't save invalid value
    // TODO: review
    if (!this.valid) return Promise.reject(new Error('Field is invalid'));
    // save only value which was modified.
    // TODO: review
    if (!this._fieldStorage.isFieldUnsaved(this._pathToField)) return Promise.reject(new Error(`Value hasn't modified`));

    // do save after debounce
    const fieldPromise = this._debouncedCall.exec(this._startSaving, force);

    // rise form's save handler
    this._form.$startDebounceSave(force);

    return fieldPromise;
  }

  /**
   * Do field saving process.
   * * set "isSaving" state to true
   * * rise "saveStart" event
   * * call "save" callback. If it returns a promise - wait for it
   * and after saving ends:
   * * set "isSaving" state to false
   * * rise "saveEnd" event
   * @return {Promise|undefined} - if "save" callback returns promise this method returns it.
   * @private
   */
  _startSaving() {
    const data = this.value;
    const saveCb = this._fieldStorage.getHandler(this._pathToField, 'onSave');
    const saveEnd = (err) => {
      // set saving: false
      this._fieldStorage.setState(this._pathToField, 'isSaving', false);
      // rise saveEnd
      this._fieldStorage.emit(this._pathToField, 'saveEnd', err);
    };

    // set saving: true
    this._fieldStorage.setState(this._pathToField, 'isSaving', true);
    // rise saveStart event
    this._fieldStorage.emit(this._pathToField, 'saveStart', data);

    if (saveCb) {
      // run save callback
      const cbPromise = saveCb(data);
      if (isPromise(cbPromise)) {
        return cbPromise
          .then(() => saveEnd())
          .catch((error) => {
            saveEnd({ error });

            return Promise.reject(error);
          });
      }
    }

    // if save callback hasn't returned a promise
    // or if there isn't a save callback
    saveEnd();
  }


  /**
   * It calls form field on value changed by user
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @param {string} pathToField
   * @param {*} oldValue
   * @param {*} newValue
   */
  _riseUserChangeEvent(pathToField, oldValue, newValue) {
    const eventData = {
      fieldName: pathToField,
      oldValue,
      value: newValue,
      event: 'change',
    };

    // call field's onChange handler
    const fieldOnChangeHandler = this._fieldStorage.getHandler(pathToField, 'onChange');
    if (fieldOnChangeHandler) fieldOnChangeHandler(eventData);
    // call forms's onChange handler
    const formOnChangeHandler = this._form.$getHandler('onChange');
    if (formOnChangeHandler) formOnChangeHandler({ [pathToField]: newValue });

    // Rise events field's change handler
    this._fieldStorage.emit(pathToField, 'change', eventData);
    // run form's change handler
    this._form.$emit('change', { [pathToField]: newValue });
  }

  _setValueProcess(newValue) {
    // set top value layer
    this._fieldStorage.setValue(this._pathToField, newValue);
    // TODO: будет поднято 2 storageChange события
    this.$recalcDirty();
    this.form.validate();
  }

};
