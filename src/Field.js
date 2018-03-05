const _ = require('lodash');
const DebouncedCall = require('./DebouncedCall');
const { calculateDirty, getFieldName, parseValidateCbReturn } = require('./helpers');


module.exports = class Field {
  constructor(pathToField, params, { form, events, storage, state }) {
    this._form = form;
    this._events = events;
    this._storage = storage;
    this._state = state;
    // TODO: may be move to events?
    this._debouncedCall = new DebouncedCall(this._form.config.debounceTime);

    this._pathToField = pathToField;
    this._fieldName = getFieldName(pathToField);
    this._validateCallback = undefined;

    this._init(params);

    this.handleChange = this.handleChange.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handlePressEnter = this.handlePressEnter.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
  }

  _init(params) {
    // init state
    this._storage.initFieldState(this._pathToField);

    if (!_.isUndefined(params.disabled)) this._setDisabled(params.disabled);
    if (!_.isUndefined(params.debounceTime)) this.setDebounceTime(params.debounceTime);

    this._setDefaultAndInitialValue(params.defaultValue, params.initial);

    if (params.validate) this.setValidateCb(params.validate);

    if (!_.isUndefined(this.value)) {
      this._events.riseSilentChangeEvent(this._pathToField, undefined);
    }
  }

  get form() {
    return this._form;
  }
  get savedValue() {
    return this._storage.getFieldState(this._pathToField, 'savedValue');
  }

  /**
   * Current value
   * @return {*}
   */
  get value() {
    return this._storage.getValue(this._pathToField);
  }
  get name() {
    return this._fieldName;
  }
  get path() {
    return this._pathToField;
  }
  get dirty() {
    return this._storage.getFieldState(this._pathToField, 'dirty');
  }
  get touched() {
    return this._storage.getFieldState(this._pathToField, 'touched');
  }
  get valid() {
    return this._storage.getFieldState(this._pathToField, 'valid');
  }
  get invalidMsg() {
    return this._storage.getFieldState(this._pathToField, 'invalidMsg');
  }

  // TODO: ??????
  get validCombo() {
    if (this.valid) return true;

    if (this.invalidMsg) return this.invalidMsg;

    return false;
  }

  get saving() {
    return this._storage.getFieldState(this._pathToField, 'saving');
  }
  get focused() {
    return this._storage.getFieldState(this._pathToField, 'focused');
  }
  get disabled() {
    return this._storage.getFieldState(this._pathToField, 'disabled');
  }
  get defaultValue() {
    return this._storage.getFieldState(this._pathToField, 'defaultValue');
  }
  get validateCb() {
    return this._validateCallback;
  }
  get debounceTime() {
    return this._debouncedCall.delay;
  }

  /**
   * Set value silently(don't rise a change event).
   * It does:
   * * It set a new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises anyChange event for field and whole form.
   *
   * It doesn't:
   * * It doesn't rise onChange callback (for user's events).
   * * It doesn't update "touched" state.
   * @param newValue
   */
  setValue(newValue) {
    const oldValue = _.cloneDeep(this.value);

    this._setValueDirtyValidate(newValue);

    // rise silent change events if value and old value are different
    if (!_.isEqual(oldValue, newValue)) {
      this._events.riseSilentChangeEvent(this._pathToField, oldValue);
    }
  }

  /**
   * Set previously saved value. Usually it is saved on server value.
   * @param {*} newSavedValue
   */
  setSavedValue(newSavedValue) {
    // set saved value
    this._storage.setFieldState(this._pathToField, { savedValue: newSavedValue });

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this._form.config.allowFocusedFieldUpdating || (!this._form.config.allowFocusedFieldUpdating && !this.focused)) {
      this.setValue(newSavedValue);
    }
  }

  setDisabled(value) {
    this._setDisabled(value);
    this._events.riseAnyChange(this._pathToField);
  }

  setValidateCb(validateCallback) {

    // TODO: remove

    if (!_.isUndefined(validateCallback) && !_.isFunction(validateCallback)) {
      throw new Error(`Bad type of validate callback`);
    }
    this._validateCallback = validateCallback;

    // revalidate with new callback
    this.validate();
  }

  setDebounceTime(delay) {
    const toNumber = _.toNumber(delay);
    if (_.isNull(toNumber) || _.isNaN(toNumber)) throw new Error(`Bad debounceTime value`);
    // TODO: doesn't work
    this._debouncedCall.delay = toNumber;
  }


  /**
   * It's an onChange handler. It must be placed to input onChange attribute.
   * It sets a new user's value and start saving.
   * It does:
   * * don't do anything if field is disabled
   * * don't save if value isn't changed
   * * update value
   * * update "touched" and "dirty" states
   * * validate
   * * Rise a "change" events for field and form
   * * Run an onChange callback if it assigned.
   * * Start saving
   * @param {*} newValue
   */
  handleChange(newValue) {

    // TODO: review

    // don't do anything if disabled
    if (this.disabled) return;

    const oldValue = _.cloneDeep(this.value);
    const isChanged = !_.isEqual(oldValue, newValue);

    if (isChanged) {
      // set touched to true
      if (!this.touched) this._state.setFieldAndFormTouched(this._pathToField);
      // set value, dirty state and validate
      this._setValueDirtyValidate(newValue);
    }

    // rise change event and save only changed value
    if (!this._form.config.allowSaveUnmodifiedField && !isChanged) return;

    // rise change by user event handlers and callbacks of form and field
    this._events.riseUserChangeEvent(this._pathToField, oldValue, newValue);
    // start save with debounced delay
    this._addSavingInQueue(false);
  }

  /**
   * Set field's "focused" prop to true.
   */
  handleFocusIn() {
    this._storage.setFieldState(this._pathToField, { focused: true });
  }

  /**
   * Set field's "focused" prop to false.
   */
  handleBlur() {
    this._storage.setFieldState(this._pathToField, { focused: false });
    // start save immediately
    this._addSavingInQueue(true);
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
    this._events.addFieldListener(this._pathToField, eventName, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user
   */
  onChange(cb) {
    this._events.setFieldCallback(this._pathToField, 'change', cb);
  }

  /**
   * It rises with debounce delay on start saving.
   * @param cb
   */
  onSave(cb) {
    this._events.setFieldCallback(this._pathToField, 'save', cb);
  }

  /**
   * It updates "valid" and "invalidMsg" states using field's validate rule.
   * It runs a validate callback which must return:
   * * valid: true
   * * invalid: not empty string or false
   * @returns {boolean|string|undefined}
   *   * true/false - valid/invalid
   *   * string it is an error message, means invalid
   *   * undefined - hasn't done a validation because the field doesn't have a validate callback.
   */
  validate() {
    if (!this._validateCallback) return;

    let cbReturn = this._validateCallback({ value: this.value, formValues: this.form.values });


    // TODO: review
    //if (_.isUndefined(cbReturn)) throw new Error(`Validate callback returns an undefined, what does it mean?`);
    if (_.isUndefined(cbReturn)) {
      cbReturn = true;
    }


    if (cbReturn === '') throw new Error(`Validate callback returns an empty string, what does it mean?`);

    const { valid, invalidMsg, result } = parseValidateCbReturn(cbReturn);

    this._storage.setFieldState(this._pathToField, {
      valid,
      invalidMsg,
    });

    return result;
  }

  /**
   * Start field save immediately.
   * @return {Promise}
   */
  save() {
    return this._addSavingInQueue(true);
  }

  /**
   * Clear value(user input) and set saved value to current value.
   */
  clear() {
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
   * Recalculate dirty state.
   */
  $recalcDirty() {
    this._state.setFieldAndFormDirty(this._pathToField,
      calculateDirty(this.value, this.savedValue));
  }


  _setDisabled(value) {
    if (!_.isBoolean(value)) throw new Error(`Bad type of disabled value`);
    this._storage.setFieldState(this._pathToField, { disabled: value });
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
  _addSavingInQueue(force) {

    // TODO: review

    // don't save invalid value
    if (!this.valid) return Promise.reject(new Error('Field is invalid'));
    // save only value which was modified.
    if (!this._storage.isFieldUnsaved(this._pathToField)) return Promise.reject(new Error(`Value hasn't modified`));

    // rise a field's save handlers, callback and switch saving state
    const fieldPromise = this._debouncedCall.exec(() => this._events.$startSaving(
      this.value,
      this._events.getFieldCallback(this._pathToField, 'save'),
      (...p) => this._state.setFieldSavingState(this._pathToField, ...p),
      (...p) => this._events.riseFieldEvent(this._pathToField, ...p)
    ), force);

    // rise form's save handler
    this._events.riseFormDebouncedSave(force);

    return fieldPromise;
  }

  _setValueDirtyValidate(newValue) {

    // TODO: may be move to _state?

    // set to outer value layer
    this._storage.setValue(this._pathToField, newValue);
    this.$recalcDirty();
    this.validate();
  }


  /**
   * Set default and initial values. Initial has more priority.
   * @param {*} defaultValue
   * @param {*} initial
   * @private
   */
  _setDefaultAndInitialValue(defaultValue, initial) {

    // TODO: review

    let currentValue;
    if (!_.isUndefined(defaultValue)) {
      this._storage.setFieldState(this._pathToField, { defaultValue });
      // set default value to current value
      currentValue = defaultValue;
    }
    // initial has more priority
    if (!_.isUndefined(initial)) currentValue = initial;
    if (!_.isUndefined(currentValue)) this._setValueDirtyValidate(currentValue);
  }

};
