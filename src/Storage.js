const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const { fromJS, Map } = require('immutable');
const { findRecursively } = require('./helpers/helpers');


module.exports = class Storage {
  constructor() {
    this.events = new EventEmitter();

    this._store = {
      formState: new Map(this._generateNewFormState()),
      fieldsState: {},
      // combined saved and edited values
      values: new Map(),
    };
  }

  getWholeStorageState() {
    const store = {
      formState: this._store.formState.toJS(),
      fieldsState: {},
      values: this._store.values.toJS(),
    };

    this.eachField((field, path) => {
      _.set(store.fieldsState, path, field.toJS());
    });

    return store;
  }

  getWholeFormState() {
    return this._store.formState.toJS();
  }

  getFormState(stateName) {
    const formState = this._store.formState.toJS();

    return formState[stateName];
  }

  getCombinedValues() {
    return this._store.values.toJS();
  }

  getListeners(name) {
    return this.events.listeners(name);
  }

  destroy() {
    this._store = {};
    const eventNames = this.events.eventNames();

    _.each(eventNames, (name) => {
      // get handlers by name
      _.each(this.getListeners(name), (handler) => {
        this.events.off(name, handler);
      });
    });
  }

  setFormState(partlyState) {
    const prevState = this.getWholeFormState();

    this._store.formState = fromJS({
      ...prevState,
      ...partlyState,
    });
  }

  eachField(cb) {
    findRecursively(this._store.fieldsState, (field, path) => {

      // TODO: review

      if (!field || !(field instanceof Map)) return;

      cb(field, path);

      return false;
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

    return _.get(fieldState.toJS(), stateName);
  }

  getCombinedValue(pathToField) {
    const values = this._store.values.toJS();

    return _.get(values, pathToField);
  }

  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * @param pathToField
   * @param partlyState
   */
  setFieldState(pathToField, partlyState) {
    const prevState = this.getWholeFieldState(pathToField);

    const newState = fromJS({
      ...prevState,
      ...partlyState,
    });

    _.set(this._store.fieldsState, pathToField, newState);

    _.find(partlyState, (item, name) => {
      if (_.includes([ 'savedValue', 'editedValue' ], name)) return true;
    });

    // TODO: get вернут mutable

    this._updateCombinedValue(pathToField, newState.get('savedValue'), newState.get('editedValue'));
  }

  generateNewFieldState() {
    return {
      defaultValue: undefined,
      dirty: false,
      disabled: false,
      // top layer
      editedValue: undefined,
      focused: false,
      initial: undefined,
      invalidMsg: undefined,
      touched: false,
      // bottom layer
      savedValue: undefined,
      saving: false,
    };
  }

  _generateNewFormState() {
    return {
      touched: false,
      submitting: false,
      saving: false,
      valid: true,
    };
  }

  _updateCombinedValue(pathToField, savedValue, editedValue) {
    const value = _.isUndefined(editedValue) ? savedValue : editedValue;
    this._store.values = this._store.values.setIn(pathToField.split('.'), value);
  }

};
