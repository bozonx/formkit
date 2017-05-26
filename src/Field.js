import _ from 'lodash';

import FieldBase from './FieldBase';


export default class Field extends FieldBase {
  /**
   * It's an onChange handler. It must be placed to input onChange attribute.
   * It sets a new user's value and start saving.
   * It does:
   * * don't do anything if field is disabled
   * * don't save if value isn't changed
   * * update userInput value
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

    this.__storage.setUserInput(this.$pathToField, newValue);
    // set touched to true
    if (!this.touched) this.$form.$handlers.handleFieldStateChange(this.$pathToField, 'touched', true);
    this.$recalcDirty();
    this.validate();

    // rise change by user handler
    this.$form.$handlers.handleValueChangeByUser(this.$pathToField, oldCombinedValue, newValue);

    // rise field's change callback
    if (this.$onChangeCallback) this.$onChangeCallback(newValue);

    this.__startSave();
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
    if (!this._validateCb) return;

    const cbReturn = this._validateCb({ value: this.value });
    const isValid = (_.isString(cbReturn) && !cbReturn) || cbReturn === true || _.isUndefined(cbReturn);
    let invalidMsg;
    if (!isValid) {
      invalidMsg = cbReturn || '';
    }

    this.$form.$handlers.handleFieldValidStateChange(this.$pathToField, isValid, invalidMsg);

    return isValid;
  }

  resetUserInput() {
    this.__storage.setUserInput(this.$pathToField, undefined);
    this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, false);
    // TODO: надо пересчитать validate
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
}
