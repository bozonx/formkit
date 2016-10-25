import _ from 'lodash';

import { extendDeep } from './helpers';

export default class FieldState {
  constructor(field, name) {
    this._field = field;

    // this.state = {
    //   name: name,
    //   value: null,
    //   // It uses only for compare value with initialValue. Don't use it for binding.
    //   initialValue: null,
    //   valid: null,
    //   dirty: null,
    //   touched: null,
    //   disabled: null,
    //   checked: null,
    //   errorMsg: null,
    //   placeholder: null,
    //   //focused: null,
    //   //validateRule: null,
    // }

    // set field's initial state
    this._updateFieldState({
      name: name,
      value: null,
      // It uses only for compare value with initialValue. Don't use it for binding.
      initialValue: null,
      valid: null,
      dirty: false,
      touched: false,
      disabled: null,
      checked: null,
      errorMsg: null,
      placeholder: null,
      //focused: null,
      //validateRule: null,
    });
  }

  // TODO: может использовать один метод?

  setValue(newValue) {
    this._updateFieldState({value: newValue});
  }

  setInitialValue(newValue) {
    this._updateFieldState({initialValue: newValue});
  }

  setStateValue(stateName, newValue) {
    this._updateFieldState({[stateName]: newValue});
  }

  _updateFieldState(newState) {
    extendDeep(this._field, newState);
  }
}
