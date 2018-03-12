const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const DebouncedCall = require('./DebouncedCall');


/**
 * It sets field and form states and rise an event if need
 * @class
 */
module.exports = class Events {
  constructor(form, storage, state) {
    const eventEmitter = new EventEmitter();

    this._form = form;
    this._eventEmitter = eventEmitter;
    this._storage = storage;
    this._state = state;

    // this._formCallbacks = {
    //   change: null,
    //   save: null,
    //   submit: null,
    // };
    this._fieldsCallbacks = {};

    this._formSaveDebouncedCall = new DebouncedCall(this._form.config.debounceTime);
  }


};
