import _ from 'lodash';

import DebouncedCall from './DebouncedCall';

export default class FieldBase {
  constructor(form, fieldName) {
    this.$form = form;
    this.$pathToField = fieldName;
    this.$onChangeCallback = null;
    this.__storage = this.$form.$storage;
    this.__onSaveCallback = null;
    this.__debouncedCall = new DebouncedCall(this.$form.$config.debounceTime);

    this._debouncedCb = undefined;

    // init state
    const newField = this.__storage.generateNewFieldState(fieldName);
    this.__storage.setFieldState(this.$pathToField, newField);
    this.__storage.setFieldValue(this.$pathToField, null);
    this.__storage.setFieldInitialValue(this.$pathToField, null);
  }

  /////// writable
  get dirty() {
    return this.__storage.getFieldState(this.$pathToField, 'dirty');
  }
  set dirty(value) {
    this.__storage.setFieldState(this.$pathToField, {dirty: value});
  }

  get touched() {
    return this.__storage.getFieldState(this.$pathToField, 'touched');
  }
  set touched(value) {
    this.__storage.setFieldState(this.$pathToField, {touched: value});
  }

  get disabled() {
    return this.__storage.getFieldState(this.$pathToField, 'disabled');
  }
  set disabled(value) {
    this.__storage.setFieldState(this.$pathToField, {disabled: value});
  }

  get validateRule() {
    return this._validateRule;
    //return this.__storage.getFieldState(this.$pathToField, 'validateRule');
  }
  set validateRule(value) {
    this._validateRule = value;
    //this.__storage.setFieldState(this.$pathToField, 'validateRule', value);
  }
  get debounceTime() {
    return this.__debouncedCall.delay;
  }
  set debounceTime(delay) {
    this.__debouncedCall.delay = delay;
  }


  /////// read only
  get name() {
    return this.__storage.getFieldState(this.$pathToField, 'name');
  }

  get value() {
    return this.__storage.getFieldValue(this.$pathToField);
  }

  get initialValue() {
    return this.__storage.getFieldInitialValue(this.$pathToField);
  }

  get valid() {
    return this.__storage.getFieldState(this.$pathToField, 'valid');
  }

  get invalidMsg() {
    return this.__storage.getFieldState(this.$pathToField, 'invalidMsg');
  }

  get saving() {
    return this.__storage.getFieldState(this.$pathToField, 'saving');
  }

  get focused() {
    return this.__storage.getFieldState(this.$pathToField, 'focused');
  }

  __startSave(force) {
    // don't save invalid value
    if (!this.__storage.getFieldState(this.$pathToField, 'valid')) return;
    if (!this.$form.$handlers.isUnsaved(this.$pathToField)) return;

    if (this.__onSaveCallback) {
      this.__debouncedCall.exec(this.__onSaveCallback, force, this.__storage.getFieldValue(this.$pathToField));
    }

    this.$form.$handlers.handleFieldSave(force);
  }

  __updateDirty() {
    var value = this.__storage.getFieldValue(this.$pathToField);
    var initialValue = this.__storage.getFieldInitialValue(this.$pathToField);
    var newValue;

    if (value === '' && (initialValue === '' || _.isNil(initialValue))) {
      // 0 compares as common value.
      newValue = false;
    }
    else {
      // just compare initial value and value
      newValue = value !== initialValue;
    }

    this.__storage.setFieldState(this.$pathToField, {dirty: newValue});
    this.$form.$handlers.handleFieldStateChange('dirty', newValue);
  }

}
