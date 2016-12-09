import _ from 'lodash';

import Field from './Field';
import FormHandlers from './FormHandlers';


export default class FormBase {
  constructor(storage, config, events, log) {
    this.$storage = storage;
    this.$events = events;
    this.$config = config;
    this.$log = log;
    this.$handlers = new FormHandlers(this);

    this.fields = {};

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

  set values(newValues) {
    this._hardUpdateValues(newValues);
  }

  setValuesSilently(newValues) {
    this.$storage.outerValues(newValues);
  }

  $getWholeStorageState() {
    return this.$storage.getWholeStorageState();
  }


  __recreateFieldInstances(outerValues) {
    _.each(outerValues, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) this.fields[fieldName] = new Field(this, fieldName);
      if (this.fields[fieldName]) this.fields[fieldName].outerValue = value;
    });
  }

  _hardUpdateValues(newValues) {
    _.each(newValues, (value, fieldName) => {
      if (this.fields[fieldName]) this.fields[fieldName].value = value;
    });
  }

  // /**
  //  * It set all the values to fields silently.
  //  * It creates a field if it doesn't exist.
  //  * @param newValues
  //  */
  // setValues(newValues) {
  //   this.$fieldsManager.updateValues(_.cloneDeep(newValues));
  // }
  //
  // /**
  //  * It set initial values for all the fields.
  //  * It creates a field if it doesn't exist.
  //  * It set value if it doesn't assign.
  //  * @param initialState
  //  */
  // setInitialValues(initialState) {
  //   this.$fieldsManager.setInitialValues(initialState);
  // }

  // getValues() {
  //   // TOdO: refactor
  //   return this.$storage.getFieldsValues();
  // }
  //
  // getInitialValues() {
  //   // TOdO: refactor
  //   return this.$storage.getFieldsInitialValues();
  // }

  // $updateValues(newValues) {
  //   extendDeep(this, {values: newValues});
  // }



}
