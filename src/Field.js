import _ from 'lodash';

import FieldState from './FormState';

export default class Field {
  constructor(fieldName) {
    this.name = fieldName;

    this._fieldState = new FieldState(fieldName);
    this._updateState();
  }

  setValue(value) {
    this._fieldState.setState({value});
    this._updateState();
  }

  /**
   * onChange handler - it must be placed to input onChange attribute
   */
  handleChange(event) {
    var value = event.target.value;
    this._fieldState.setState({value});
    this._updateState();
  }

  validate() {
    // TODO: !!!
  }

  /**
   * It rises on each field's value change
   */
  onChange(cb) {
    // TODO: !!!
  }

  _updateState() {
    // TODO: проверить
    _.extend(this, this._fieldState.state);
  }
}
