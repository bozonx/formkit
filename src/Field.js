import _ from 'lodash';

import FieldBase from './FieldBase';

export default class Field extends FieldBase {
  constructor(form, fieldName) {
    super(form, fieldName);
  }

  setDebounceTime(time) {
    this.$debounceTime = time;
  }

  /**
   * Silent update. It uses for set outer(from machine) values (not user's).
   *
   * It does:
   * * It set up new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises anyChange event for field and whore form.
   *
   * It doesn't:
   * * It doesn't rise onChange callback (for user's events).
   * * It doesn't update "touched" state.
   * @param {*} newValue
   */
  updateValue(newValue) {
    // set up value to this field instance and to storage
    this.$fieldState.setValue(newValue);

    // tell to form - a value is updated
    this.$form.$$handleAnyFieldsValueChange(this.$pathToField);

    // update dirty state
    this.$updateDirty();
    // run validation
    this.validate();
  }

  /**
   * It sets initial value.
   * It does:
   * * It set up new initial value to self instance and to storage
   * * if value of field is null and field is untouched, it sets value (see updateValue() method)
   * * if field isn't touched, it just update dirty state
   * @param newValue
   */
  setInitialValue(newValue) {
    // set up initial value to this field instance and to storage
    this.$fieldState.setInitialValue(newValue);

    if (_.isNull(this.$fieldState.getValue()) && !this.$fieldState.getState('touched')) {
      this.updateValue(newValue)
    }
    else {
      this.$updateDirty();
    }
  }

  /**
   * It's onChange handler. It must be placed to input onChange attribute.
   * It does:
   * * all of updateValue() method
   * * update "touched" state
   * * Rises "change" events for field and form
   * * Runs onChange callback if it assigned.
   * * Starts saving
   */
  handleChange(newValue) {
    this.updateValue(newValue);

    // update touched
    if (!this.$fieldState.getState('touched')) {
      this.$fieldState.setStateValue('touched', true);
      this.$form.$$handleAnyFieldsStateChange('touched', true);
    }

    this.$form.$$handleAnyFieldsValueChangeByUser(
      this.$pathToField, this.$fieldState.getValue());

    if (this.$onChangeCallback) this.$onChangeCallback(newValue);

    this.$startSave();
  }

  /**
   * bind it to you component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handlePressEnter() {
    this.$startSave(true);
  }

  /**
   * It rises on field's value change by user
   */
  onChange(cb) {
    this.$onChangeCallback = cb;
  }

  /**
   * It rises with debounce on start saving after update field value by user
   * @param cb
   */
  onSave(cb) {
    this.$onSaveCallback = cb;
  }

  /**
   * It updates "valid" and "invalidMsg" states using field's validate rule.
   * @returns {boolean|undefined}
   */
  validate() {
    if (!this.validateRule) return;
    var ruleReturn = this.validateRule(this.$fieldState.getValue());
    var isValid = ruleReturn === true;
    var invalidMsg = (_.isString(ruleReturn)) ? ruleReturn : '';

    this.$fieldState.setStateValue('valid', isValid);
    this.$fieldState.setStateValue('invalidMsg', (isValid) ? null : invalidMsg);
    this.$form.$$handleAnyFieldsValidStateChange(this.$pathToField, isValid, invalidMsg);
    return isValid;
  }

}
