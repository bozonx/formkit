import _ from 'lodash';

import Field from './Field';

export default class FieldsManager {
  constructor() {
    this.fields = {};
  }

  init(fieldsList) {
    // TODO: Validate fieldsList - it must be string array

    _.each(fieldsList, (fieldName) => {
      this.fields[fieldName] = new Field(fieldName);
    });
  }
}
