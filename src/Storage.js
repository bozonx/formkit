const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const { Map } = require('immutable');
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
    return this._store.formState.get(stateName);
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

    this._store.formState = new Map({
      ...prevState,
      ...partlyState,
    });
  }

  eachField(cb) {
    findRecursively(this._store.fieldsState, (field, path) => {
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

    return fieldState.getIn(stateName.split('.'));
  }

  getCombinedValue(pathToField) {
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

    const newState = {
      ...prevState,
      ...partlyState,
    };

    _.set(this._store.fieldsState, pathToField, new Map(newState));

    let needToCombineValue;

    _.find(partlyState, (item, name) => {
      if (_.includes([ 'savedValue', 'editedValue' ], name)) {
        needToCombineValue = true;

        return true;
      }
    });

    if (needToCombineValue) {
      // TODO: why???
      this._updateCombinedValue(pathToField, newState.savedValue, newState.editedValue);
      //this._updateCombinedValue(pathToField, partlyState.savedValue, partlyState.editedValue);
    }
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
