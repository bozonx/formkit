import _ from 'lodash';

import Field from './Field';

export default class FieldsManager {
  constructor(form) {
    this._form = form;
    this.fields = {};
  }

  setValues(newValues) {
    _.each(newValues, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) {
        this.fields[fieldName] = new Field(this._form, fieldName);
      }

      // TODO: нужно втихую устанвливать значения или с подъемом событий?
      this.fields[fieldName].setValueSilently(value);
      this._form.$valueChanged(fieldName, value);
    });
  }

  setInitialValues(initialState) {
    _.each(initialState, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) {
        this.fields[fieldName] = new Field(this._form, fieldName);
      }

      this.fields[fieldName].setInitialValue(value);
      this._form.$initialValueChanged(fieldName, value);
    });
  }

}
