import _ from 'lodash';

import Field from './Field';

export default class FieldsManager {
  constructor(form) {
    this._form = form;
    this.fields = {};
  }

  init(fieldsList) {
    // TODO: Validate fieldsList - it must be string array

    _.each(fieldsList, (fieldName) => {
      this.fields[fieldName] = new Field(this._form, fieldName);
    });
  }

  setFieldsStateSilent(initialState) {
    _.each(initialState, (value, fieldName) => {
      this.fields[fieldName].setValueSilenly(value);
    });
  }

}
