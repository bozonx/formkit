import _ from 'lodash';

import Field from './Field';

export default class FieldsManager {
  constructor(form) {
    this._form = form;
    this.fields = {};
  }

  // init(fieldsList) {
  //   this.fieldsList = fieldsList;
  //
  //   // TODO: Validate fieldsList - it must be string array
  //
  //   _.each(fieldsList, (fieldName) => {
  //     this.fields[fieldName] = new Field(this._form, fieldName);
  //   });
  // }

  setInitialValues(initialState) {
    _.each(initialState, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) {
        this.fields[fieldName] = new Field(this._form, fieldName);
      }

      this.fields[fieldName].setInitialValue(value);
    });
  }

}
