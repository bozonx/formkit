import _ from 'lodash';

import { extendDeep } from './helpers';

export default class FormState {
  constructor(form) {
    this._form = form;

    // set initial form state
    this._updateFormState({
      values: {},
      initialValues: {},
      dirty: false,
      touched: false,
      submitting: false,
      valid: true,
      invalidMsg: {},
      //focusedField: null,
    });
  }

  getValues() {
    return _.cloneDeep(this._form.values);
  }

  getInitialValues() {
    return _.cloneDeep(this._form.initialValues);
  }

  setStateValue(stateName, newValue) {
    this._form[stateName] = newValue;
  }

  setFieldValue(fieldName, newValue) {
    this._updateFormState({values: {[fieldName]: newValue}});
  }

  setFieldInitialValue(fieldName, newValue) {
    this._updateFormState({initialValues: {[fieldName]: newValue}});
  }

  _updateFormState(newState) {
    extendDeep(this._form, newState);
  }

}
