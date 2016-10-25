import _ from 'lodash';

//import events from './events';
import FieldState from './FieldState';

export default class Field {
  constructor(form, fieldName) {
    this._form = form;

    this._fieldState = new FieldState(this, fieldName);
  }

  setValue(newValue) {
    this.setValueSilently(newValue);
    this._form.$valueChanged(this.name, this.value);
    if (!this.touched) this._fieldState.setStateValue('touched', true);
    this._updateDirty();
  }

  setInitialValue(newValue) {
    this._fieldState.setInitialValue(newValue);

    // TODO: может ли пользователь установить null?
    if (_.isNull(this.value)) {
      this._fieldState.setValue(newValue);
    }

    this._updateDirty();

    // TODO: наверное если не в первый раз, то можно поднимать событие
  }

  setValueSilently(newValue) {
    this._fieldState.setValue(newValue);
  }

  /**
   * onChange handler - it must be placed to input onChange attribute
   */
  handleChange(event) {
    var value = event.target.value;
    //this._fieldState.setState({value});
    //this._updateState();
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

  _updateDirty() {
    this._fieldState.setStateValue('dirty', this.value !== this.initialValue);
  }

  // _riseUpdateEvent() {
  //   events.emit('field.value__update', {
  //     name: this.name,
  //     newValue: this.value,
  //     field: this,
  //   });
  // }
}
