import _ from 'lodash';

import FormState from './FormState';
import FieldsManager from './FieldsManager';

export default class Form {
  constructor() {
    this._formState = new FormState(this);
    this._fieldsManager = new FieldsManager(this);

    // TODO: может тоже раскрыть
    this.state = this._formState.state;

    this.fields = this._fieldsManager.fields;
  }

  // TODO: переименовать
  $updateValues(fieldName, newValue) {
    this._formState.setFieldValue(fieldName, newValue);
  }

  $updateInitialValue(fieldName, newInitialValue) {
    this._formState.setFieldInitialValue(fieldName, newInitialValue);
  }

  init(initialState) {
    this.setInitialValues(initialState);
  }

  getValues() {
    return this._formState.getValues();
  }

  setValues(newValues) {
    this._fieldsManager.setValues(newValues);
  }

  setInitialValues(initialState) {
    this._fieldsManager.setInitialValues(initialState);
  }


  ////////////////////////////////////////
  onChange(cb) {
    // TODO: !!!
  }

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
