const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const { Map } = require('immutable');


module.exports = class Storage {
  constructor() {
    this.events = new EventEmitter();
    this.init();
  }

  init() {
    this._store = {
      formState: this._generateNewFormState(),
      fieldsState: {},
      values: {},
    };
  }

  $store() {
    return this._store;
  }

  getWholeStorageState() {
    return _.cloneDeep(this._store);
  }

  getWholeFieldState(pathToField) {
    const fieldState = _.get(this._store.fieldsState, pathToField);

    if (!fieldState) return;

    return fieldState.toJS();
  }

  getFieldState(pathToField, stateName) {
    const fieldState = _.get(this._store.fieldsState, pathToField);

    if (!fieldState) return;

    return fieldState.getIn(stateName.split('.')).toJS();
  }

  getValue(pathToField) {
    return this._store.values.getIn(pathToField.split('.')).toJS();
  }

  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * @param pathToField
   * @param partlyState
   */
  setFieldState(pathToField, partlyState) {
    const newState = new Map({
      ..._.get(this._store.fieldsState, pathToField).toJS(),
      ...partlyState,
    });

    _.set(this._store.fieldsState, pathToField, newState);
  }

  setValue(pathToField, newValue) {
    this._store.values = this._store.values.setIn(pathToField.split('.'), newValue);
  }

  generateNewFieldState() {
    return {
      dirty: false,
      touched: false,
      // TODO: нет смысла сохранять
      valid: true,
      invalidMsg: undefined,
      validCombined: true,
      saving: false,
      disabled: false,
      focused: false,
      defaultValue: undefined,
      savedValue: undefined,
    };
  }

  _generateNewFormState() {
    return {
      dirty: false,
      touched: false,
      submitting: false,
      saving: false,
    };
  }

};
