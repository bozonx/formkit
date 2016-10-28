import _ from 'lodash';

import FieldBase from './FieldBase';

export default class Field extends FieldBase {
  constructor(form, fieldName) {
    super(form, fieldName);
  }

  /**
   * Silent update.
   * It uses for set outer(from machine) values (not user's).
   * It doesn't rise onChange callback.
   * It rises anyChange event.
   * It doesn't update "touched" state.
   * It updates "dirty" and "valid" state.
   * @param newValue
   */
  updateValue(newValue) {
    this.$fieldState.setValue(newValue);

    this._updateDirty();
    this.validate();

    this.$form.$$handleAnyFieldsValueChange(
      this.$fieldState.getState('name'), this.$fieldState.getValue());

    //if (this._onAnyChangeCallback) this._onAnyChangeCallback(newValue);
  }

  setDebounceTime(time) {
    this.$debounceTime = time;
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
    this.$form.$$handleAnyFieldsValidStateChange(this.$fieldState.getState('name'), isValid, invalidMsg);
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
      this.$fieldState.getState('name'), this.$fieldState.getValue());

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
