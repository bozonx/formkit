import _ from 'lodash';

import FieldState from './FieldState';
import DebouncedCall from './DebouncedCall';

export default class FieldBase {
  constructor(form, fieldName) {
    this.$form = form;
    this.$pathToField = fieldName;
    this.$fieldState = new FieldState(this.$form, this, this.$pathToField);
    this.$onChangeCallback = null;
    this.__onSaveCallback = null;
    this.__debouncedCall = new DebouncedCall(this.$form.$config.debounceTime);

    this._debouncedCb = undefined;
  }

  /////// writable
  get dirty() {
    return this.$fieldState.getState('dirty');
  }
  set dirty(value) {
    this.$fieldState.setStateValue('dirty', value);
  }

  get touched() {
    return this.$fieldState.getState('touched');
  }
  set touched(value) {
    this.$fieldState.setStateValue('touched', value);
  }

  get disabled() {
    return this.$fieldState.getState('disabled');
  }
  set disabled(value) {
    this.$fieldState.setStateValue('disabled', value);
  }

  get validateRule() {
    return this._validateRule;
    //return this.$fieldState.getState('validateRule');
  }
  set validateRule(value) {
    this._validateRule = value;
    //this.$fieldState.setStateValue('validateRule', value);
  }
  get debounceTime() {
    return this.__debouncedCall.delay;
  }
  set debounceTime(delay) {
    this.__debouncedCall.delay = delay;
  }


  /////// read only
  get name() {
    return this.$fieldState.getState('name');
  }

  get value() {
    return this.$form.$storage.getFieldValue(this.$pathToField);
  }

  get initialValue() {
    return this.$fieldState.getInitialValue();
  }

  get valid() {
    return this.$fieldState.getState('valid');
  }

  get invalidMsg() {
    return this.$fieldState.getState('invalidMsg');
  }

  get saving() {
    return this.$fieldState.getState('saving');
  }

  get focused() {
    return this.$fieldState.getState('focused');
  }

  __startSave(force) {
    // don't save invalid value
    if (!this.$fieldState.getState('valid')) return;
    if (!this.$form.$handlers.isUnsaved(this.$pathToField)) return;

    if (this.__onSaveCallback) {
      this.__debouncedCall.exec(this.__onSaveCallback, force, this.$form.$storage.getFieldValue(this.$pathToField));
    }

    this.$form.$handlers.handleFieldSave(force);
  }

  __updateDirty() {
    var value = this.$form.$storage.getFieldValue(this.$pathToField);
    var initialValue = this.$fieldState.getInitialValue();
    var newValue;

    if (value === '' && (initialValue === '' || _.isNil(initialValue))) {
      // 0 compares as common value.
      newValue = false;
    }
    else {
      // just compare initial value and value
      newValue = value !== initialValue;
    }

    this.$fieldState.setStateValue('dirty', newValue);
    this.$form.$handlers.handleFieldStateChange('dirty', newValue);
  }

}
