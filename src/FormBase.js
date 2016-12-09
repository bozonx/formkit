import _ from 'lodash';

import { extendDeep } from './helpers';
import FieldsManager from './FieldsManager';
import FormHandlers from './FormHandlers';

export default class FormBase {
  constructor(storage, config, events, log) {
    this.$storage = storage;
    this.$events = events;
    this.$config = config;
    this.$log = log;
    this.$fieldsManager = new FieldsManager(this);
    this.$handlers = new FormHandlers(this);

    this.fields = this.$fieldsManager.fields;
    this.values = {};

    // set initial form state
    var newFormState = this.$storage.generateNewFormState();
    this.$storage.setFormState(newFormState);
  }

  get initialValues() {return this.$storage.getFieldsInitialValues()}
  get dirty() {return this.$storage.getFormState('dirty')}
  get touched() {return this.$storage.getFormState('touched')}
  get submitting() {return this.$storage.getFormState('submitting')}
  get valid() {return this.$storage.getFormState('valid')}
  get invalidMsgs() {return this.$storage.getFormState('invalidMsgs')}


  getValues() {
    // TOdO: refactor
    return this.$storage.getFieldsValues();
  }

  getInitialValues() {
    // TOdO: refactor
    return this.$storage.getFieldsInitialValues();
  }

  $getWholeStorageState() {
    return this.$storage.getWholeStorageState();
  }

  $updateValues(newValues) {
    extendDeep(this, {values: newValues});
  }

}
