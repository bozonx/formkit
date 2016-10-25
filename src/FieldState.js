import _ from 'lodash';

export default class FieldState {
  constructor(name) {
    this.state = {
      name: name,
      value: null,
      // It uses only for compare value with initialValue. Don't use it for binding.
      initialValue: null,
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

  // TODO: может использовать один метод?

  setValue(newValue) {
    this.state.value = newValue;
  }

  setInitialValue(newValue) {
    this.state.initialValue = newValue;
  }

  setState(newState) {
    _.extend(this.state, newState);
  }

}
