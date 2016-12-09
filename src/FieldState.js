import { extendDeep } from './helpers';

export default class FieldState {
  constructor(form, field, name) {
    this._form = form;
    this._field = field;
    this._pathToField = name;

    // init state
    var newField = this._form.$storage.generateNewFieldState(name);
    this._form.$storage.setFieldState(this._pathToField, newField);

    this._form.$storage.setFieldValue(this._pathToField, null);
    this._form.$storage.setFieldInitialValue(this._pathToField, null);
  }

  // getValue() {
  //   return this._form.$storage.getFieldValue(this._pathToField);
  // }
  //
  // getInitialValue() {
  //   return this._form.$storage.getFieldInitialValue(this._pathToField);
  // }
  //
  // getState(stateName) {
  //   return this._form.$storage.getFieldState(this._pathToField, stateName);
  // }

  // setValue(newValue) {
  //   this._form.$storage.setFieldValue(this._pathToField, newValue);
  // }

  // setInitialValue(newValue) {
  //   this._form.$storage.setFieldInitialValue(this._pathToField, newValue);
  // }

  // setStateValue(stateName, newValue) {
  //   this._form.$storage.setFieldState(this._pathToField, {[stateName]: newValue});
  // }
}
