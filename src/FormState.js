import _ from 'lodash';

export default class FormState {
  constructor() {
    this.state = {
      values: {},
      dirty: null,
      touched: null,
      valid: null,
      focusedField: null,
    };
  }

  getValues() {
    return _.cloneDeep(this.state.values);
  }

  setValue(fieldName, newValue) {
    this.state.values[fieldName] = newValue;
  }

  setState(newState) {
    _.extend(this.state, newState);
  }
}
