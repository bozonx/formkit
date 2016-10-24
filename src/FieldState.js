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

  setState(newState) {
    // TODO: тут нужнен deep extend
    _.extend(this.state, newState);
  }

}
