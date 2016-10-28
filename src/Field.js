import _ from 'lodash';

import FieldState from './FieldState';

export default class Field {
  constructor(form, fieldName) {
    this._form = form;

    this._onChangeCallback = null;
    this._onAnyChangeCallback = null;
    this._onSaveCallback = null;

    this.debounceTime = 1000;

    this._fieldState = new FieldState(form, this, fieldName);
    this._debouncedCb = _.debounce((cb, value) => {
      cb(value);
    }, this.debounceTime);
  }

  /**
   * Silent update.
   * It uses for set outer(from machine) values (not user's).
   * It doesn't rise onChange callback.
   * It rises onAnyChange callback.
   * It doesn't update "touched" state.
   * It updates "dirty" and "valid" state.
   * @param newValue
   */
  updateValue(newValue) {
    this._fieldState.setValue(newValue);

    this._updateDirty();
    this.validate();

    this._form.$$handleAnyFieldsValueChange(
      this._fieldState.getState('name'), this._fieldState.getValue());

    if (this._onAnyChangeCallback) this._onAnyChangeCallback(newValue);
  }

  setInitialValue(newValue) {
    // TODO: пересмотреть

    this._fieldState.setInitialValue(newValue);

    // TODO: может ли пользователь установить null?
    if (_.isNull(this._fieldState.getValue())) {
      this.updateValue(newValue)
      // this._fieldState.setValue(newValue);
      // this.validate();
    }
    else {
      this._updateDirty();
    }

    // TODO: наверное если не в первый раз, то можно поднимать событие
  }


  validate() {
    if (!this.validateRule) return;
    var ruleReturn = this.validateRule(this._fieldState.getValue());
    var isValid = ruleReturn === true;
    var invalidMsg = (_.isString(ruleReturn)) ? ruleReturn : '';

    this._fieldState.setStateValue('valid', isValid);
    this._fieldState.setStateValue('invalidMsg', (isValid) ? null : invalidMsg);
    this._form.$$handleAnyFieldsValidStateChange(this._fieldState.getState('name'), isValid, invalidMsg);
    return isValid;
  }

  /**
   * onChange handler - it must be placed to input onChange attribute
   */
  handleChange(newValue) {
    this.updateValue(newValue);

    // update touched
    if (!this._fieldState.getState('touched')) {
      this._fieldState.setStateValue('touched', true);
      this._form.$$handleAnyFieldsStateChange('touched', true);
    }

    this._form.$$handleAnyFieldsValueChangeByUser(
      this._fieldState.getState('name'), this._fieldState.getValue());

    if (this._onChangeCallback) this._onChangeCallback(newValue);

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
    this._onChangeCallback = cb;
  }

  onAnyChange(cb) {
    this._onAnyChangeCallback = cb;
  }

  onSave(cb) {
    this._onSaveCallback = cb;
  }

  _startSave(force) {
    // don't save invalid value
    if (!this._fieldState.getState('valid')) return;

    if (force) {
      if (this._onSaveCallback) this._onSaveCallback(this._fieldState.getValue());
      // cancelling
      this._debouncedCb.cancel();
    }
    else {
      if (this._onSaveCallback) this._debouncedCb(this._onSaveCallback, this._fieldState.getValue());
    }
  }

  _updateDirty() {
    var value = this._fieldState.getValue();
    var initialValue = this._fieldState.getInitialValue();
    var newValue;

    if (value === '' && (initialValue === '' || _.isNil(initialValue))) {
      // 0 compares as common value.
      newValue = false;
    }
    else {
      // just compare initial value and value
      newValue = value !== initialValue;
    }

    this._fieldState.setStateValue('dirty', newValue);
    this._form.$$handleAnyFieldsStateChange('dirty', newValue);
  }

}
