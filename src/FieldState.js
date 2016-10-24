import _ from 'lodash';

export default class FieldState {
  constructor(name) {
    this.state = {
      name: name,
      value: null,
      valid: null,
      dirty: null,
      touched: null,
      disabled: null,
      checked: null,
      errorMsg: null,
      placeholder: null,
      //focused: null,
      //validateRule: null,
    }
  }

  setValue(newValue) {
    this.state.value = newValue;
  }

  setState(newState) {
    _.extend(this.state, newState);
  }

}
