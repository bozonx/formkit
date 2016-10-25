import _ from 'lodash';

import FormState from './FormState';
import FieldsManager from './FieldsManager';

export default class Form {
  constructor() {
    this._formState = new FormState(this);
    this._fieldsManager = new FieldsManager(this);

    this._onChangeCallback = null;
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

  ////////////////////////////////////////

  /**
   * It must be placed to <form> element on onSubmit attribute.
   * @param cb
   */
  handleSubmit(cb) {
    // TODO: !!!
  }

  onSubmit(cb) {
    // TODO: !!!
  }

  reset() {
    // TODO: !!!
  }

}
