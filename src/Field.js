import _ from 'lodash';

import DebouncedCall from './DebouncedCall';
import { calculateDirty } from './helpers';


export default class Field {
  constructor(form, fieldName, params) {
    this._form = form;
    this._pathToField = fieldName;
    this._storage = this._form.$storage;
    this._debouncedCall = new DebouncedCall(this._form.$config.debounceTime);

    this._init(fieldName, params);
  }

  _init(fieldName, params) {
    this._onSaveCallback = null;
    this._onChangeCallback = null;
    this._debouncedCb = undefined;
    this._validateCb = undefined;

    // init state
    // TODO: !!!! this._pathToField и fieldName = одно и то же
    this._storage.initFieldState(this._pathToField, fieldName);

    // set initial value
    if (params.initial) {
      this.setValue(params.initial);
    }

    if (!_.isNil(params.defaultValue)) {
      this._storage.setFieldState(this._pathToField, { defaultValue: params.defaultValue });
      // set default value to current value
      if (_.isNil(this.value)) {
        this.setValue(params.defaultValue);
      }
    }

    if (params.disabled) {
      // TODO: test it
      this._storage.setFieldState(this._pathToField, { disabled: params.disabled });
    }

    // TODO: set validate callback
    // TODO: set debounceTime
  }

  get form() {
    return this._form;
  }
  get savedValue() {
    return this._storage.getSavedValue(this._pathToField);
  }

  /**
   * Current value
   * @return {*}
   */
  get value() {
    return this._storage.getValue(this._pathToField);
  }
  get name() {
    return this._storage.getFieldState(this._pathToField, 'name');
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
    return this._validateCb;
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

    // set to outer value layer
    this._storage.setValue(this._pathToField, newValue);
    this.$recalcDirty();

    // re validate and rise events
    if (!_.isEqual(oldValue, this.value)) {
      this.validate();
      // rise silent change events
      this._form.$handlers.handleSilentValueChange(this._pathToField, oldValue);
    }
  }


  setSavedValue(newSavedValue) {
    const oldValue = _.cloneDeep(this.value);

    // set saved value
    this._storage.setSavedValue(this._pathToField, newSavedValue);

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this._form.$config.allowFocusedFieldUpdating || (!this._form.$config.allowFocusedFieldUpdating && !this.focused)) {
      // TODO: пересмотреть
      this._storage.setValue(this._pathToField, newSavedValue);
      this.$recalcDirty();

      // re validate and rise events
      if (!_.isEqual(oldValue, newSavedValue)) {
        this.validate();
        // rise silent change events
        this._form.$handlers.handleSilentValueChange(this._pathToField, oldValue);
      }
    }
  }

  setDisabled(value) {
    this._storage.setFieldState(this._pathToField, { disabled: value });
  }
  setValidateCb(value) {
    this._validateCb = value;
  }
  setDebounceTime(delay) {
    this._debouncedCall.delay = delay;
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
    if (!this._form.$config.unchangedValueSaving && _.isEqual(oldCombinedValue, newValue)) return;

    // set value to storage
    this._storage.setValue(this._pathToField, newValue);
    // set touched to true
    if (!this.touched) this._form.$handlers.handleFieldStateChange(this._pathToField, 'touched', true);
    this.$recalcDirty();
    this.validate();

    // rise change by user handler
    this._form.$handlers.handleValueChangeByUser(this._pathToField, oldCombinedValue, newValue);

    // rise field's change callback
    if (this._onChangeCallback) this._onChangeCallback(newValue);

    this.__startSave(false);
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
    this._form.$events.addListener(`field.${this._pathToField}.${eventName}`, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user
   */
  onChange(cb) {
    this._onChangeCallback = cb;
  }

  /**
   * It rises with debounce delay on start saving.
   * @param cb
   */
  onSave(cb) {
    this._onSaveCallback = cb;
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

    this._form.$handlers.handleFieldValidStateChange(this._pathToField, isValid, invalidMsg);

    return isValid;
  }

  /**
   * Clear value(user input) and set saved value to input.
   */
  clear() {
    // TODO: сбросить на saved или defautl значение
    // TODO: наверное должны сброситься touched, dirty, valid, invalidMsg у формы и полей
    // TODO: установить savedValue
    this._storage.setValue(this._pathToField, this._storage.getSavedValue(this._pathToField));
    // TODO: use $recalcDirty()
    this._form.$handlers.handleFieldDirtyChange(this._pathToField, false);
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
    this._form.$handlers.handleFieldDirtyChange(this._pathToField,
      calculateDirty(this.value, this.savedValue));
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
    if (!this._form.$handlers.isUnsaved(this._pathToField)) return;

    // rise a field's save callback
    if (this._onSaveCallback) {
      // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
      // TODO: должно подняться собитие save этого поля
      this._debouncedCall.exec(this._onSaveCallback, force, this.value);
    }
    // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
    // TODO: должно подняться собитие save формы
    // rise form's save callback
    this._form.$handlers.handleFieldSave(force);
  }

}
