import _ from 'lodash';

import FormState from './FormState';
import FieldsManager from './FieldsManager';

export default class Form {
  constructor() {
    this._formState = new FormState(this);
    this._fieldsManager = new FieldsManager(this);

    this._onChangeCallback = null;
    this._onSubmitCallback = null;
    this.fields = this._fieldsManager.fields;
  }

  $stateValueChanged(stateName, newValue) {
    this._formState.setStateValue(stateName, newValue);
  }

  $valueChangedByUser(fieldName, newValue) {
    if (this._onChangeCallback) this._onChangeCallback(fieldName, newValue);
  }

  $valueChanged(fieldName, newValue) {
    this._formState.setFieldValue(fieldName, newValue);
  }

  $initialValueChanged(fieldName, newInitialValue) {
    this._formState.setFieldInitialValue(fieldName, newInitialValue);
  }

  init(initialState) {
    this.setInitialValues(initialState);
  }

  getValues() {
    return this._formState.getValues();
  }

  getInitialValues() {
    return this._formState.getInitialValues();
  }

  setValues(newValues) {
    this._fieldsManager.setValues(newValues);
  }

  setInitialValues(initialState) {
    this._fieldsManager.setInitialValues(initialState);
  }

  onChange(cb) {
    this._onChangeCallback = cb;
  }

  /**
   * It must be placed to <form> element on onSubmit attribute.
   */
  handleSubmit() {
    if (!this._onSubmitCallback) return;
    this._formState.setStateValue('submitting', true);
    var returnedValue = this._onSubmitCallback(this.values);
    // if promise
    if (returnedValue && returnedValue.then) {
      return returnedValue.then(() => {
        this._formState.setStateValue('submitting', false);
      }, () => {
        this._formState.setStateValue('submitting', false);
      });
    }
    this._formState.setStateValue('submitting', false);
  }

  onSubmit(cb) {
    this._onSubmitCallback = cb;
  }

  reset() {
    // TODO: !!!
  }
}
