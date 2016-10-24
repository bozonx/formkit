import _ from 'lodash';

import FormState from './FormState';

export default class Form {
  constructor() {
    this._formState = new new FormState();
    this.state = this._formState.state;
  }

  init(fieldsList) {

  }

  getValues() {
    return _.cloneDeep(this.state);
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
