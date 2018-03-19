const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const { Map } = require('immutable');
const { findFieldLikeStructureRecursively } = require('./helpers');


module.exports = class Storage {
  constructor() {
    this.events = new EventEmitter();

    this._store = {
      formState: new Map(this._generateNewFormState()),
      fieldsState: {},
      values: new Map(),
    };
  }

  $store() {
    return this._store;
  }

  getWholeStorageState() {
    return _.cloneDeep(this._store);
  }

  getWholeFormState() {
    return this._store.formState.toJS();
  }

  getFormState(stateName) {
    return this._store.formState.get(stateName);
  }

  getFormValues() {
    return this._store.values.toJS();
  }

  setFormState(partlyState) {
    const prevState = this.getWholeFormState();

    this._store.formState = new Map({
      ...prevState,
      ...partlyState,
    });
  }

  eachField(cb) {
    findFieldLikeStructureRecursively(this._store.fieldsState, (field, path) => {
      return cb(field, path);
    });
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
    return this._store.values.getIn(pathToField.split('.'));
  }

  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * @param pathToField
   * @param partlyState
   */
  setFieldState(pathToField, partlyState) {
    const prevState = this.getWholeFieldState(pathToField);

    const newState = new Map({
      ...prevState,
      ...partlyState,
    });

    _.set(this._store.fieldsState, pathToField, newState);
  }

  setValue(pathToField, newValue) {
    this._store.values = this._store.values.setIn(pathToField.split('.'), newValue);
  }

  generateNewFieldState() {
    return {
      defaultValue: undefined,
      dirty: false,
      disabled: false,
      initial: undefined,
      touched: false,
      invalidMsg: undefined,
      savedValue: undefined,
      saving: false,
      focused: false,
      // TODO: нет смысла сохранять
      valid: true,
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
