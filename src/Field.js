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
    this._updateDirty();
    // run validation
    this.validate();
  }



  setInitialValue(newValue) {
    // TODO: пересмотреть

    this.$fieldState.setInitialValue(newValue);

    // TODO: может ли пользователь установить null?
    if (_.isNull(this.$fieldState.getValue())) {
      this.updateValue(newValue)
      // this.$fieldState.setValue(newValue);
      // this.validate();
    }
    else {
      this._updateDirty();
    }

    // TODO: наверное если не в первый раз, то можно поднимать событие
  }


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

  /**
   * onChange handler - it must be placed to input onChange attribute
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

    this._startSave();
  }

  /**
   * bind it to you component to onEnter event.
   * It immediately starts save
   */
  handlePressEnter() {
    this._startSave(true);
  }

  /**
   * It rises on each field's value change
   */
  onChange(cb) {
    this.$onChangeCallback = cb;
  }

  // onAnyChange(cb) {
  //   this._onAnyChangeCallback = cb;
  // }

  onSave(cb) {
    this.$onSaveCallback = cb;
  }

}
