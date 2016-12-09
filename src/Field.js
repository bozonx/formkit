import _ from 'lodash';

import FieldBase from './FieldBase';

export default class Field extends FieldBase {
  constructor(form, fieldName) {
    super(form, fieldName);
  }

  /**
   * Silent update. It uses for set outer(from machine) values (not user's).
   *
   * It does:
   * * It set up new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises anyChange event for field and whole form.
   *
   * It doesn't:
   * * It doesn't rise onChange callback (for user's events).
   * * It doesn't update "touched" state.
   * @param {*} newValue
   */
  updateValue(newValue) {
    var oldValue = this.__storage.getFieldValue(this.$pathToField);

    // set up value to this field instance and to storage
    this.__storage.setFieldValue(this.$pathToField, newValue);

    // tell to form - a value is updated
    this.$form.$handlers.handleSilentValueChange(this.$pathToField, oldValue);

    // update dirty state
    this.__updateDirty();
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
    this.__storage.setFieldInitialValue(this.$pathToField, newValue);

    // TODO: дублируется установка, она устанавливается ещё в this.$fieldState.setInitialValue
    this.$form.$handlers.handleInitialValueChange(this.$pathToField, newValue);

    if (_.isNull(this.__storage.getFieldValue(this.$pathToField)) && !this.__storage.getFieldState(this.$pathToField, 'touched')) {
      this.updateValue(newValue);
    }
    else {
      this.__updateDirty();
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
    // don't do anything if disabled
    if (this.__storage.getFieldState(this.$pathToField, 'disabled')) return;

    var oldValue = this.__storage.getFieldValue(this.$pathToField);

    // don't save unchanged value if it allows in config.
    if (!this.$form.$config.unchangedValueSaving && oldValue === newValue) return;

    this.updateValue(newValue);

    // update touched
    if (!this.__storage.getFieldState(this.$pathToField, 'touched')) {
      this.__storage.setFieldState(this.$pathToField, {touched: true});
      this.$form.$handlers.handleFieldStateChange('touched', true);
    }

    this.$form.$handlers.handleValueChangeByUser(this.$pathToField, oldValue, newValue);

    if (this.$onChangeCallback) this.$onChangeCallback(newValue);

    this.__startSave();
  }

  handleFocusIn() {
    this.__storage.setFieldState(this.$pathToField, {focused: true});
  }

  handleBlur() {
    this.__storage.setFieldState(this.$pathToField, {focused: false});
    this.__startSave(true);
  }

  /**
   * bind it to your component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handlePressEnter() {
    if (this.__storage.getFieldState(this.$pathToField, 'disabled')) return;
    this.__startSave(true);
  }

  on(eventName, cb) {
    this.$form.$events.addListener(`field.${this.$pathToField}.${eventName}`, cb);
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
    this.__onSaveCallback = cb;
  }

  /**
   * It updates "valid" and "invalidMsg" states using field's validate rule.
   * @returns {boolean|undefined}
   */
  validate() {
    if (!this.validateRule) return;
    var ruleReturn = this.validateRule(this.__storage.getFieldValue(this.$pathToField));
    var isValid = ruleReturn === true;
    var invalidMsg = (_.isString(ruleReturn)) ? ruleReturn : '';

    this.__storage.setFieldState(this.$pathToField, {valid: isValid});
    this.__storage.setFieldState(this.$pathToField, {invalidMsg: (isValid) ? null : invalidMsg});
    this.$form.$handlers.handleAnyFieldsValidStateChange(this.$pathToField, isValid, invalidMsg);
    return isValid;
  }

}
