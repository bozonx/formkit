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
    this.setValueSilently(newValue);

    // only for user input
    if (!this.touched) {
      this._fieldState.setStateValue('touched', true);
      this._form.$stateValueChanged('touched', true);
    }

    this._form.$valueChangedByUser(this.name, this.value);

    if (this._onChangeCallback) this._onChangeCallback(newValue);
  }

  /**
   * It uses for set outer values (not user's)
   * @param newValue
   */
  setValueSilently(newValue) {
    this._fieldState.setValue(newValue);
    this._form.$valueChanged(this.name, this.value);

    this._updateDirty();
    this.validate();
    if (this._onAnyChangeCallback) this._onAnyChangeCallback(newValue);
  }

  setInitialValue(newValue) {
    this._fieldState.setInitialValue(newValue);

    // TODO: может ли пользователь установить null?
    if (_.isNull(this.value)) {
      this._fieldState.setValue(newValue);
      this.validate();
    }

    this._updateDirty();

    // TODO: наверное если не в первый раз, то можно поднимать событие
  }


  validate() {
    if (!this.validateRule) return;
    var ruleReturn = this.validateRule(this.value);
    var isValid = ruleReturn === true;
    var invalidMsg = (_.isString(ruleReturn)) ? ruleReturn : '';

    this._fieldState.setStateValue('valid', isValid);
    this._fieldState.setStateValue('invalidMsg', (isValid) ? null : invalidMsg);
    this._form.$validChanged(this.name, isValid, invalidMsg);
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
    this._form.$stateValueChanged('dirty', newValue);
  }

  //_riseUpdateEvent() {
  //  events.emit('field.value__update', {
  //    name: this.name,
  //    newValue: this.value,
  //    field: this,
  //  });
  //}
}
