import _ from 'lodash';

import Field from './Field';
import FormHandlers from './FormHandlers';


export default class FormBase {
  constructor(storage, config, events, log) {
    // TODO: use getter
    this.fields = {};

    this.$storage = storage;
    this.$events = events;
    this.$config = config;
    this.$log = log;
    this.$handlers = new FormHandlers(this);

    // set initial form state
    var newFormState = this.$storage.generateNewFormState();
    this.$storage.setFormState(newFormState);
  }

  get values() {return this.$storage.values}
  get dirty() {return this.$storage.getFormState('dirty')}
  get touched() {return this.$storage.getFormState('touched')}
  get submitting() {return this.$storage.getFormState('submitting')}
  get valid() {return this.$storage.getFormState('valid')}
  get invalidMsgs() {return this.$storage.getFormState('invalidMsgs')}

  set values(newValues) {this._hardUpdateValues(newValues)}

  $getWholeStorageState() {
    return this.$storage.getWholeStorageState();
  }


  __recreateFieldInstances(outerValues) {
    _.each(outerValues, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) this.fields[fieldName] = new Field(this, fieldName);
      this.fields[fieldName].outerValue = value;
    });
  }

  _hardUpdateValues(newValues) {
    _.each(newValues, (value, fieldName) => {
      if (this.fields[fieldName]) this.fields[fieldName].value = value;
    });
  }

}
