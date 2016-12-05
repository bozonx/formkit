import _ from 'lodash';

import { extendDeep } from './helpers';
import FormState from './FormState';
import FieldsManager from './FieldsManager';
import FormHandlers from './FormHandlers';

export default class FormBase {
  constructor(storage, config, events, log) {
    this.$storage = storage;
    this.$events = events;
    this.$config = config;
    this.$log = log;
    this.$formState = new FormState(this);
    this.$fieldsManager = new FieldsManager(this);
    this.$handlers = new FormHandlers(this);

    this.fields = this.$fieldsManager.fields;
    this.values = {};
  }

  $getWholeStorageState() {
    return this.$storage.getWholeStorageState();
  }

  $updateValues(newValues) {
    extendDeep(this, {values: newValues});
  }

}
