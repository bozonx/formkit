const _ = require('lodash');
const DebouncedCall = require('./DebouncedCall');
const { calculateDirty, getFieldName, isPromise } = require('./helpers');


module.exports = class Field {
  constructor(pathToField, params, { form, fieldStorage }) {
    this._form = form;
    this._fieldStorage = fieldStorage;
    // TODO: may be move to events?
    this._debouncedCall = new DebouncedCall(this._form.config.debounceTime);

    this._pathToField = pathToField;
    this._fieldName = getFieldName(pathToField);

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
    // TODO: review
    // init state
    this._fieldStorage.initFieldState(this._pathToField);

    if (!_.isUndefined(params.disabled)) this._setDisabled(params.disabled);
    if (!_.isUndefined(params.debounceTime)) this.setDebounceTime(params.debounceTime);

    this._setDefaultAndInitialValue(params.defaultValue, params.initial);

    if (!_.isUndefined(this.value)) {
      this._events.riseSilentChangeEvent(this._pathToField, undefined);
    }
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

  // TODO: ??????
  get validCombo() {
    if (this.valid) return true;

    if (this.invalidMsg) return this.invalidMsg;

    return false;
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
      this._fieldStorage.riseSilentChangeEvent(this._pathToField, oldValue);
    }
  }

  /**
   * Set previously saved value. Usually it is saved on server value.
   * @param {*} newSavedValue
   */
  setSavedValue(newSavedValue) {
    // set saved value
    this._fieldStorage.setFieldState(this._pathToField, { savedValue: newSavedValue });

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this._form.config.allowFocusedFieldUpdating || (!this._form.config.allowFocusedFieldUpdating && !this.focused)) {
      this.setValue(newSavedValue);
    }
  }

  setDisabled(value) {
    this._setDisabled(value);
    this._fieldStorage.riseAnyChange(this._pathToField);
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
      // TODO: do not combine actions
      if (!this.touched) this._fieldStorage.setFieldAndFormTouched(this._pathToField);
      // set value, dirty state and validate
      this._setValueDirtyValidate(newValue);
    }

    // rise change event and save only changed value
    if (!this._form.config.allowSaveUnmodifiedField && !isChanged) return;

    // rise change by user event handlers and callbacks of form and field
    this._fieldStorage.riseUserChangeEvent(this._pathToField, oldValue, newValue);
    // start save with debounced delay
    this._addSavingInQueue(false);
  }

  /**
   * Set field's "focused" prop to true.
   */
  handleFocusIn() {
    this._fieldStorage.setFieldState(this._pathToField, { focused: true });
  }

  /**
   * Set field's "focused" prop to false.
   */
  handleBlur() {
    this._fieldStorage.setFieldState(this._pathToField, { focused: false });
    // start save immediately
    // TODO: use save
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
    this._fieldStorage.addFieldListener(this._pathToField, eventName, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user
   */
  onChange(cb) {
    this._fieldStorage.setFieldCallback(this._pathToField, 'change', cb);
  }

  /**
   * It rises with debounce delay on start saving.
   * @param cb
   */
  onSave(cb) {
    this._fieldStorage.setFieldCallback(this._pathToField, 'save', cb);
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
    this._fieldStorage.setFieldAndFormDirty(
      this._pathToField,
      calculateDirty(this.value, this.savedValue)
    );
  }

  /**
   * It calls from form after validating.
   * @param {string|undefined} invalidMsg - invalid message of undefined
   */
  $setValidState(invalidMsg) {
    this._fieldStorage.setFieldState(this._pathToField, {
      valid: _.isUndefined(invalidMsg),
      invalidMsg,
    });
  }


  _setDisabled(value) {
    if (!_.isBoolean(value)) throw new Error(`Disabled has to be boolean`);
    this._fieldStorage.setFieldState(this._pathToField, { disabled: value });
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
    if (!this._fieldStorage.isFieldUnsaved(this._pathToField)) return Promise.reject(new Error(`Value hasn't modified`));

    // rise a field's save handlers, callback and switch saving state
    const fieldPromise = this._debouncedCall.exec(() => this._startSaving(), force);

    // rise form's save handler
    this._fieldStorage.riseFormDebouncedSave(force);

    return fieldPromise;
  }

  _startSaving() {
    const data = this.value;
    const saveCb = this._fieldStorage.getCallBack('save');
    const saveEnd = (err) => {
      // set saving: false
      this._fieldStorage.setMeta(this._pathToField, 'save', false);
      // rise saveEnd
      this._fieldStorage.emit(this._pathToField, 'saveEnd', err);
    };

    // set saving: true
    this._fieldStorage.setMeta(this._pathToField, 'save', true);
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

  _setValueDirtyValidate(newValue) {

    // TODO: may be move to _state?

    // set to outer value layer
    this._fieldStorage.setValue(this._pathToField, newValue);
    this.$recalcDirty();
    this.form.validate();
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
      this._fieldStorage.setFieldState(this._pathToField, { defaultValue });
      // set default value to current value
      currentValue = defaultValue;
    }
    // initial has more priority
    if (!_.isUndefined(initial)) currentValue = initial;
    if (!_.isUndefined(currentValue)) this._setValueDirtyValidate(currentValue);
  }

};
