import _ from 'lodash';

import FormState from './FormState';
import FieldsManager from './FieldsManager';

export default class Form {
  constructor(events, log) {
    this._events = events;
    this._log = log;
    this._formState = new new FormState();
    this._fieldsManager = new new FieldsManager();

    this.state = this._formState.state;
    this.fields = this._fieldsManager.fields;
  }

  init(fieldsList) {
    this._fieldsManager.init(fieldsList);
  }

  getValues() {
    return this._formState.getValues();
  }

  setInitialState(initialValues) {
    // TODO: add initial state
  }

  onChange(cb) {
    // TODO: !!!
  }

  onSubmit(cb) {
    // TODO: !!!
  }

  reset() {
    // TODO: !!!
  }
}
