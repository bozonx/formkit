import _ from 'lodash';

import FormState from './FormState';
import FieldsManager from './FieldsManager';

export default class Form {
  constructor() {
    this._formState = new FormState();
    this._fieldsManager = new FieldsManager(this);

    // TODO: может тоже раскрыть
    this.state = this._formState.state;
    this.fields = this._fieldsManager.fields;
  }

  $updateValues(fieldName, newValue) {
    this._formState.setValue(fieldName, newValue);
  }

  init(fieldsList) {
    this._fieldsManager.init(fieldsList);
  }

  getValues() {
    return this._formState.getValues();
  }

  setInitialValues(initialState) {
    this._fieldsManager.setFieldsStateSilent(initialState);
  }

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
