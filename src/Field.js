import _ from 'lodash';

import DebouncedCall from './DebouncedCall';
import { calculateDirty, getFieldName, parseValidateCbReturn } from './helpers';


export default class Field {
  constructor(form, pathToField, params) {
    this._form = form;
    this._storage = this._form.$storage;
    this._debouncedCall = new DebouncedCall(this._form.config.debounceTime);

    this._pathToField = pathToField;
    this._fieldName = getFieldName(pathToField);
    this._validateCallback = undefined;

    this._init(params);
  }

  _init(params) {
    // init state
    this._storage.initFieldState(this._pathToField);

    // TODO: setDisabled без подъема собития
    if (!_.isUndefined(params.disabled)) this.setDisabled(params.disabled);
    if (!_.isUndefined(params.debounceTime)) this.setDebounceTime(params.debounceTime);
    if (params.validate) this.setValidateCb(params.validate);

    this._setDefaultAndInitialValue(params.defaultValue, params.initial);
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

    // set to outer value layer
    this._storage.setValue(this._pathToField, newValue);
    this.$recalcDirty();
    this.validate();

    // rise silent change events if value and old value are different
    if (!_.isEqual(oldValue, newValue)) {
      this._form.$state.riseSilentChangeEvent(this._pathToField, oldValue);
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
    if (!_.isBoolean(value)) throw new Error(`Bad type of disabled value`);
    this._storage.setFieldState(this._pathToField, { disabled: value });
    // TODO: надо поднять событие silent или any
  }
  setValidateCb(validateCallback) {
    if (!_.isUndefined(validateCallback) && !_.isFunction(validateCallback)) {
      throw new Error(`Bad type of validate callback`);
    }
    this._validateCallback = validateCallback;
  }
  setDebounceTime(delay) {
    const toNumber = _.toNumber(delay);
    if (_.isNull(toNumber) || _.isNaN(toNumber)) throw new Error(`Bad debounceTime value`);
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
     // don't do anything if disabled
    if (this.disabled) return;

    const oldCombinedValue = _.cloneDeep(this.value);

    // don't save unchanged value if it allows in config.
    if (!this._form.config.unchangedValueSaving && _.isEqual(oldCombinedValue, newValue)) return;

    // TODO: use this.setValue()

    // set value to storage
    this._storage.setValue(this._pathToField, newValue);
    // set touched to true
    if (!this.touched) this._form.$state.setFieldAndFormTouched(this._pathToField);
    this.$recalcDirty();
    this.validate();

    // rise change by user handler
    this._form.$state.riseUserChangeEvent(this._pathToField, oldCombinedValue, newValue);

    // start save with debounced delay
    this._startSave(false);
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
    this._startSave(true);
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
    this._startSave(true);
  }

  on(eventName, cb) {
    this._form.$state.addListener(`field.${this._pathToField}.${eventName}`, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user
   */
  onChange(cb) {
    this._form.$state.setFieldHandler(this._pathToField, 'change', cb);
  }

  /**
   * It rises with debounce delay on start saving.
   * @param cb
   */
  onSave(cb) {
    this._form.$state.setFieldHandler(this._pathToField, 'save', cb);
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

    const cbReturn = this._validateCallback({ value: this.value });

    if (_.isUndefined(cbReturn)) throw new Error(`Validate callback returns an undefined, what does it mean?`);
    if (cbReturn === '') throw new Error(`Validate callback returns an empty string, what does it mean?`);

    const { valid, invalidMsg, result } = parseValidateCbReturn(cbReturn);
    this._form.$state.setFieldAndFormValidState(this._pathToField, valid, invalidMsg);

    return result;
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
    this._form.$state.setFieldAndFormDirty(this._pathToField,
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
  _startSave(force) {
    // don't save invalid value
    if (!this.valid) return;
    // TODO: ??? for what???
    // don't save already saved value
    if (!this._form.$state.isUnsaved(this._pathToField)) return;

    // rise a field's save handler
    this._debouncedCall.exec(() => {
      this._form.$state.riseFieldEvent(this._pathToField, 'save', this.value);
      // TODO: нужно ли убирать из unsaved???
    }, force);

    // this._form.$state.riseFieldDebouncedSave(this._pathToField, this.value, force);

    // rise form's save handler
    this._form.$state.riseFormDebouncedSave(force);
  }


  /**
   * Set default and initial values. Initial has more priority.
   * @param {*} defaultValue
   * @param {*} initial
   * @private
   */
  _setDefaultAndInitialValue(defaultValue, initial) {
    let currentValue;
    if (!_.isUndefined(defaultValue)) {
      this._storage.setFieldState(this._pathToField, { defaultValue });
      // set default value to current value
      currentValue = defaultValue;
    }
    // initial has more priority
    if (!_.isUndefined(initial)) currentValue = initial;
    if (!_.isUndefined(currentValue)) this.setValue(currentValue);
  }

}
