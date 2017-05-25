import _ from 'lodash';

import FormHandlers from './FormHandlers';
import Field from './Field';
import { findInFieldRecursively } from './helpers';


export default class FormBase {
  constructor(storage, config, events) {
    this.$storage = storage;
    this.$events = events;
    this.$config = config;
    this.$handlers = new FormHandlers(this);

    // set initial form state
    this.$storage.init();

    this.__fields = {};
  }

  get fields() {
    return this.__fields;
  }
  get values() {
    return this.$storage.values;
  }
  get dirty() {
    return this.$storage.getFormState('dirty');
  }
  get touched() {
    return this.$storage.getFormState('touched');
  }
  get submitting() {
    return this.$storage.getFormState('submitting');
  }
  get valid() {
    return this.$storage.getFormState('valid');
  }
  get invalidMsgList() {
    return this.$storage.getFormState('invalidMsgList');
  }

  // set values(newValues) {this._hardUpdateValues(newValues)}

  /**
   * Soft update of values
   * @param newValues
   */
  setValues(newValues) {
    this._hardUpdateValues(newValues);
  }

  getConfig() {
    return this.$config;
  }

  $getWholeStorageState() {
    return this.$storage.getWholeStorageState();
  }

  $updateDirtyStates() {
    findInFieldRecursively(this.fields, (field) => {
      field.$updateDirty();
    });
  }

  __reinitFields(initialFields) {
    if (_.isArray(initialFields)) {
      _.each(initialFields, (pathToField) => {
        // Create new field if it doesn't exist
        let field = _.get(this.fields, pathToField);
        if (!field) {
          field = new Field(this, pathToField);
          _.set(this.fields, pathToField, field);
        }
        else {
          // reset dirty

        }

        // set outer value with reset dirty and user input
        field.value = null;
      });
    }
    else if (_.isPlainObject(initialFields)) {
      _.each(initialFields, (value, pathToField) => {
        // Create new field if it doesn't exist
        let field = _.get(this.fields, pathToField);
        if (!field) {
          field = new Field(this, pathToField);
          _.set(this.fields, pathToField, field);
        }
        else {
          // reset dirty

        }

        // set outer value with reset dirty and user input
        field.value = value;
      });
    }
    else {
      throw new Error(`Bad type of fields param`);
    }
  }

  _hardUpdateValues(newValues) {
    _.each(newValues, (value, fieldName) => {
      if (this.fields[fieldName]) this.fields[fieldName].value = value;
    });
  }

  _resetUserInput() {
    findInFieldRecursively(this.fields, (field) => {
      field.resetUserInput();
    });
  }

}
