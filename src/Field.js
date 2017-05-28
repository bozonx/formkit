import _ from 'lodash';

import DebouncedCall from './DebouncedCall';


export default class Field {
  constructor(form, fieldName, params) {
    // TODO: protected props rename to _prop
    this.$form = form;
    this.$pathToField = fieldName;
    this.$onChangeCallback = null;
    this.__storage = this.$form.$storage;
    this.__onSaveCallback = null;
    this.__debouncedCall = new DebouncedCall(this.$form.$config.debounceTime);

    this._init(fieldName, params);
  }

  _init(fieldName, params) {
    this._debouncedCb = undefined;
    this._validateCb = undefined;

    // init state
    // TODO: !!!! this.$pathToField и fieldName = одно и то же
    this.__storage.initFieldState(this.$pathToField, fieldName);

    // set initial value
    if (params.initial) {
      this.setValue(params.initial);
    }

    if (!_.isNil(params.defaultValue)) {
      this.__storage.setFieldState(this.$pathToField, { defaultValue: params.defaultValue });
      // set default value to current value
      if (_.isNil(this.value)) {
        this.setValue(params.defaultValue);
      }
    }

    if (params.disabled) {
      // TODO: test it
      this.__storage.setFieldState(this.$pathToField, { disabled: params.disabled });
    }

    // TODO: set validate callback
    // TODO: set debounceTime
  }

  get form() {
    return this.$form;
  }
  get savedValue() {
    return this.__storage.getSavedValue(this.$pathToField);
  }

  /**
   * Current value
   * @return {*}
   */
  get value() {
    return this.__storage.getValue(this.$pathToField);
  }
  get name() {
    return this.__storage.getFieldState(this.$pathToField, 'name');
  }
  get dirty() {
    return this.__storage.getFieldState(this.$pathToField, 'dirty');
  }
  get touched() {
    return this.__storage.getFieldState(this.$pathToField, 'touched');
  }
  get valid() {
    return this.__storage.getFieldState(this.$pathToField, 'valid');
  }
  get invalidMsg() {
    return this.__storage.getFieldState(this.$pathToField, 'invalidMsg');
  }
  get saving() {
    return this.__storage.getFieldState(this.$pathToField, 'saving');
  }
  get focused() {
    return this.__storage.getFieldState(this.$pathToField, 'focused');
  }
  get disabled() {
    return this.__storage.getFieldState(this.$pathToField, 'disabled');
  }
  get defaultValue() {
    return this.__storage.getFieldState(this.$pathToField, 'defaultValue');
  }
  get validateCb() {
    return this._validateCb;
  }
  get debounceTime() {
    return this.__debouncedCall.delay;
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

    // set to outer value layer
    this.__storage.setValue(this.$pathToField, newValue);
    this.$recalcDirty();

    // re validate and rise events
    if (!_.isEqual(oldValue, this.value)) {
      this.validate();
      // rise silent change events
      this.$form.$handlers.handleSilentValueChange(this.$pathToField, oldValue);
    }
  }


  setSavedValue(newSavedValue) {
    const oldValue = _.cloneDeep(this.value);

    // set saved value
    this.__storage.setSavedValue(this.$pathToField, newSavedValue);

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this.$form.$config.allowFocusedFieldUpdating || (!this.$form.$config.allowFocusedFieldUpdating && !this.focused)) {
      // TODO: пересмотреть
      this.__storage.setValue(this.$pathToField, newSavedValue);
      this.$recalcDirty();

      // re validate and rise events
      if (!_.isEqual(oldValue, newSavedValue)) {
        this.validate();
        // rise silent change events
        this.$form.$handlers.handleSilentValueChange(this.$pathToField, oldValue);
      }
    }
  }

  setDisabled(value) {
    this.__storage.setFieldState(this.$pathToField, { disabled: value });
  }
  setValidateCb(value) {
    this._validateCb = value;
  }
  setDebounceTime(delay) {
    this.__debouncedCall.delay = delay;
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
     // don't do anything if disabled
    if (this.disabled) return;

    const oldCombinedValue = _.cloneDeep(this.value);

    // don't save unchanged value if it allows in config.
    if (!this.$form.$config.unchangedValueSaving && _.isEqual(oldCombinedValue, newValue)) return;

    // set value to storage
    this.__storage.setValue(this.$pathToField, newValue);
    // set touched to true
    if (!this.touched) this.$form.$handlers.handleFieldStateChange(this.$pathToField, 'touched', true);
    this.$recalcDirty();
    this.validate();

    // rise change by user handler
    this.$form.$handlers.handleValueChangeByUser(this.$pathToField, oldCombinedValue, newValue);

    // rise field's change callback
    if (this.$onChangeCallback) this.$onChangeCallback(newValue);

    this.__startSave(false);
  }

  /**
   * Set field's "focused" prop to true.
   */
  handleFocusIn() {
    this.__storage.setFieldState(this.$pathToField, { focused: true });
  }

  /**
   * Set field's "focused" prop to false.
   */
  handleBlur() {
    this.__storage.setFieldState(this.$pathToField, { focused: false });
    this.__startSave(true);
  }

  /**
   * bind it to your component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handlePressEnter() {
    if (this.disabled) return;
    this.__startSave(true);
  }

  // TODO: лучше сделать отдельные методы - onChange, etc
  on(eventName, cb) {
    this.$form.$events.addListener(`field.${this.$pathToField}.${eventName}`, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user
   */
  onChange(cb) {
    this.$onChangeCallback = cb;
  }

  /**
   * It rises with debounce delay on start saving.
   * @param cb
   */
  onSave(cb) {
    this.__onSaveCallback = cb;
  }

  /**
   * It updates "valid" and "invalidMsg" states using field's validate rule.
   * It runs a validate callback which must retrun:
   * * valid: empty string or true or undefined
   * * not valid: not empty string or false
   * @returns {boolean|undefined}
   */
  validate() {
    // TODO: review
    if (!this._validateCb) return;

    const cbReturn = this._validateCb({ value: this.value });
    // TODO: test it
    const isValid = (_.isString(cbReturn) && !cbReturn) || cbReturn === true || _.isUndefined(cbReturn);
    let invalidMsg;
    if (!isValid) {
      invalidMsg = cbReturn || '';
    }

    this.$form.$handlers.handleFieldValidStateChange(this.$pathToField, isValid, invalidMsg);

    return isValid;
  }

  /**
   * Clear value(user input) and set saved value to input.
   */
  clear() {
    // TODO: сбросить на saved или defautl значение
    // TODO: наверное должны сброситься touched, dirty, valid, invalidMsg у формы и полей
    // TODO: установить savedValue
    this.__storage.setValue(this.$pathToField, this.__storage.getSavedValue(this.$pathToField));
    // TODO: use $recalcDirty()
    this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, false);
    // TODO: надо пересчитать validate
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
    this.__debouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this.__debouncedCall.flush();
  }

  /**
   * Recalculate dirty state.
   */
  $recalcDirty() {
    let newDirtyValue;

    // null, undefined and '' - the same, means dirty = false. 0 compares as a common value.
    if ((this.value === '' || _.isNil(this.value))
      && (this.savedValue === '' || _.isNil(this.savedValue))) {
      newDirtyValue = false;
    }
    else {
      // just compare current value and saved value
      newDirtyValue = this.value !== this.savedValue;
    }

    this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, newDirtyValue);
  }

  /**
   * Start saving field and form in they have a save handlers.
   * It will reset saving in progress before start saving.
   * @param {boolean} force
   *   * if true it will save immediately.
   *   * if false it will save with dobounce delay
   * @private
   */
  __startSave(force) {
    // don't save invalid value
    if (!this.valid) return;
    // TODO: ??? for what???
    // don't save already saved value
    if (!this.$form.$handlers.isUnsaved(this.$pathToField)) return;

    // rise a field's save callback
    if (this.__onSaveCallback) {
      // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
      // TODO: должно подняться собитие save этого поля
      this.__debouncedCall.exec(this.__onSaveCallback, force, this.value);
    }
    // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
    // TODO: должно подняться собитие save формы
    // rise form's save callback
    this.$form.$handlers.handleFieldSave(force);
  }

}
