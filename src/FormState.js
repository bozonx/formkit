
export default class FormState {
  constructor() {
    this.state = {
      values: null,
      dirty: null,
      touched: null,
      valid: null,
      focusedField: null,
    };
  }

  getValues() {
    return _.cloneDeep(this.state);
  }
}
