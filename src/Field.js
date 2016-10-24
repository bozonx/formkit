import _ from 'lodash';

//import events from './events';
import FieldState from './FieldState';

export default class Field {
  constructor(form, fieldName) {
    this._form = form;

    this._fieldState = new FieldState(fieldName);
    this._updateState();
  }

  setValue(newValue) {
    this.setValueSilenly(newValue);
    this._form.$updateValues(this.name, this.value);
    this._fieldState.setState({touched: true});
  }

  setValueSilenly(newValue) {
    this._fieldState.setValue(newValue);
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
    _.each(this._fieldState.state, (value, index) => {
      this[index] = value;
    });
  }

  // _riseUpdateEvent() {
  //   events.emit('field.value__update', {
  //     name: this.name,
  //     newValue: this.value,
  //     field: this,
  //   });
  // }
}
