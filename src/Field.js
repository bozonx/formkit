import _ from 'lodash';

//import events from './events';
import FieldState from './FieldState';

export default class Field {
  constructor(form, fieldName) {
    this._form = form;

    this._fieldState = new FieldState(this, fieldName);
  }

  /**
   * It uses for handle user input
   * @param newValue
   */
  setValue(newValue) {
    this.setValueSilently(newValue);

    // only for user input
    if (!this.touched) {
      this._fieldState.setStateValue('touched', true);
      this._form.$stateValueChanged('touched', newValue);
    }
  }

  /**
   * It uses for set outer values (not user's)
   * @param newValue
   */
  setValueSilently(newValue) {
    this._fieldState.setValue(newValue);
    this._form.$valueChanged(this.name, this.value);

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
    var newValue = this.value !== this.initialValue;
    this._fieldState.setStateValue('dirty', newValue);
    this._form.$stateValueChanged('dirty', newValue);
  }

  // _riseUpdateEvent() {
  //   events.emit('field.value__update', {
  //     name: this.name,
  //     newValue: this.value,
  //     field: this,
  //   });
  // }
}
