const _ = require('lodash');


module.exports = class Storage {
  constructor() {
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
