import { extendDeep } from './helpers';

export default class FieldState {
  constructor(form, field, name) {
    this._form = form;
    this._field = field;
    this._pathToField = name;

    // init state
    var newField = this._form.$storage.generateNewFieldState(name);
    this._form.$storage.setFieldState(this._pathToField, newField);
    this.setValue(null);
    this.setInitialValue(null);

    this._updateFieldState(newField);
  }

  getValue() {
    return this._form.$storage.getFieldValue(this._pathToField);
  }

  getInitialValue() {
    return this._form.$storage.getFieldInitialValue(this._pathToField);
  }

  getState(stateName) {
    return this._form.$storage.getFieldState(this._pathToField, stateName);
  }

  setValue(newValue) {
    this._form.$storage.setFieldValue(this._pathToField, newValue);
    this._updateFieldState({value: newValue});
  }

  setInitialValue(newValue) {
    this._form.$storage.setFieldInitialValue(this._pathToField, newValue);
    this._updateFieldState({initialValue: newValue});
  }

  setStateValue(stateName, newValue) {
    this._form.$storage.setFieldState(this._pathToField, {[stateName]: newValue});
    this._field[stateName] = newValue;
  }

  _updateFieldState(newState) {
    // TODO: нужна поддержка простых массивов - удаленные элементы останутся
    extendDeep(this._field, newState);
  }
}
