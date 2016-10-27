import { extendDeep } from './helpers';

export default class FormState {
  constructor(form) {
    this._form = form;

    // set initial form state
    var newFormState = this._form.$storage.generateNewFormState();
    this._updateFormState(newFormState);
    this._form.$storage.setFormState(newFormState);
  }

  setStateValue(path, newValue) {
    this._form.$storage.setFormState(path, newValue);
    this._form[path] = newValue;
  }

  setFieldValue(path, newValue) {
    this._form.$storage.setFieldValue(path, newValue);
    // TODO: не очень оптимально брать все значения, хотя изменилось только одно
    this._updateFormState({values: this._form.$storage.getFieldsValues()});
  }

  setFieldInitialValue(path, newValue) {
    this._form.$storage.setFieldInitialValue(path, newValue);
    // TODO: не очень оптимально брать все значения, хотя изменилось только одно
    this._updateFormState({initialValues: this._form.$storage.getFieldsInitialValues()});
  }

  _updateFormState(newState) {
    // TODO: нужна поддержка простых массивов - удаленные элементы останутся
    extendDeep(this._form, newState);
  }
}
