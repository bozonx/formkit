import _ from 'lodash';

//import events from './events';
import FieldState from './FieldState';

export default class Field {
  constructor(form, fieldName) {
    this._form = form;

    this._onChangeCallback = null;
    this._onAnyChangeCallback = null;
    this._onSaveCallback = null;

    this._fieldState = new FieldState(form, this, fieldName);
    this._debouncedCb = _.debounce((cb, value) => {
      cb(value);
    }, this.debounceTime);
  }

  /**
   * It uses for handle user input
   * @param newValue
   */
  setValue(newValue) {
    // TODO: убрать

    this.updateValue(newValue);

    // only for user input
    if (!this.touched) {
      this._fieldState.setStateValue('touched', true);
      this._form.$$handleAnyFieldsStateChange('touched', true);
    }

    this._form.$$handleAnyFieldsValueChangeByUser(
      this._fieldState.getState('name'), this._fieldState.getValue());

    if (this._onChangeCallback) this._onChangeCallback(newValue);
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
    if (_.isNull(this.value)) {
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
    var ruleReturn = this.validateRule(this.value);
    var isValid = ruleReturn === true;
    var invalidMsg = (_.isString(ruleReturn)) ? ruleReturn : '';

    this._fieldState.setStateValue('valid', isValid);
    this._fieldState.setStateValue('invalidMsg', (isValid) ? null : invalidMsg);
    this._form.$$handleAnyFieldsValidStateChange(this.name, isValid, invalidMsg);
    return isValid;
  }

  /**
   * onChange handler - it must be placed to input onChange attribute
   */
  handleChange(newValue) {
    this.setValue(newValue);
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
    if (!this.valid) return;

    if (force) {
      if (this._onSaveCallback) this._onSaveCallback(this.value);
      // cancelling
      this._debouncedCb.cancel();
    }
    else {
      if (this._onSaveCallback) this._debouncedCb(this._onSaveCallback, this.value);
    }
  }

  _updateDirty() {
    var newValue = this.value !== this.initialValue;
    this._fieldState.setStateValue('dirty', newValue);
    this._form.$$handleAnyFieldsStateChange('dirty', newValue);
  }

  //_riseUpdateEvent() {
  //  events.emit('field.value__update', {
  //    name: this.name,
  //    newValue: this.value,
  //    field: this,
  //  });
  //}
}
