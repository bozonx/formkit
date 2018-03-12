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

  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * @param pathToField
   * @param partlyState
   */
  setFieldState(pathToField, partlyState) {
    // TODO: use merge
    const newState = new Map({
      ..._.get(this._store.fieldsState, pathToField).toJS(),
      ...partlyState,
    });

    _.set(this._store.fieldsState, pathToField, newState);
  }

  generateNewFieldState() {
    return {
      dirty: false,
      touched: false,
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

  // TODO: move to form storage
  _generateNewFormState() {
    return {
      dirty: false,
      touched: false,
      submitting: false,
      saving: false,
    };
  }

};
