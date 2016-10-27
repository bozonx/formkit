import _ from 'lodash';

import Field from './Field';

export default class FieldsManager {
  constructor(form) {
    this._form = form;
    this.fields = {};
  }

  /**
   * it sets all the values silently
   * @param newValues
   */
  setValues(newValues) {
    _.each(newValues, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) {
        this.fields[fieldName] = new Field(this._form, fieldName);
      }

      this.fields[fieldName].updateValue(value);
    });
  }

  setInitialValues(initialState) {
    _.each(initialState, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) {
        this.fields[fieldName] = new Field(this._form, fieldName);
      }

      this.fields[fieldName].setInitialValue(value);
      this._form.$$handleAnyFieldsInitialValueChange(fieldName, value);
    });
  }

}
