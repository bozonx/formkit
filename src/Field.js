import _ from 'lodash';

import FieldBase from './FieldBase';

export default class Field extends FieldBase {
  constructor(form, fieldName) {
    super(form, fieldName);
  }

  /**
   * It's onChange handler. It must be placed to input onChange attribute.
   * It does:
   * * don't do anything if disabled
   * * don't save if value is unchanged
   * * update userInput value
   * * update "touched" state
   * * Rises "change" events for field and form
   * * Runs onChange callback if it assigned.
   * * Starts saving
   */
  handleChange(newValue) {
     // don't do anything if disabled
    if (this.disabled) return;

    const oldCombinedValue = _.cloneDeep(this.value);

    // TODO: а изменения разрешать?
    // don't save unchanged value if it allows in config.
    if (!this.$form.$config.unchangedValueSaving && _.isEqual(oldCombinedValue, newValue)) return;

    this.__storage.setUserInput(this.$pathToField, newValue);

    // update touched
    if (!this.touched) {
      this.__storage.setFieldState(this.$pathToField, {touched: true});
      this.$form.$handlers.handleFieldStateChange('touched', true);
    }

    // TODO: пересмотреть

    this.__updateDirty();

    this.$form.$handlers.handleValueChangeByUser(this.$pathToField, oldCombinedValue, newValue);

    // run on change callback
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
    if (this.disabled) return;
    this.__startSave(true);
  }

  on(eventName, cb) {
    this.$form.$events.addListener(`field.${this.$pathToField}.${eventName}`, cb);
  }

  /**
   * It rises on field's value changes by user
   */
  onChange(cb) {
    this.$onChangeCallback = cb;
  }

  /**
   * It rises with debounce on start saving after updating field value by user
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
    const ruleReturn = this.validateRule(this.value);
    const isValid = ruleReturn === true;
    const invalidMsg = (_.isString(ruleReturn)) ? ruleReturn : '';

    this.__storage.setFieldState(this.$pathToField, {valid: isValid});
    this.__storage.setFieldState(this.$pathToField, {invalidMsg: (isValid) ? null : invalidMsg});
    this.$form.$handlers.handleAnyFieldsValidStateChange(this.$pathToField, isValid, invalidMsg);
    return isValid;
  }

}
