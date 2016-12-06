import _ from 'lodash';

import FieldState from './FieldState';

export default class FieldBase {
  constructor(delay) {
    this._delay = delay;
    this._waiting = false;

    this.debouncedCb = _.debounce((cb) => cb(), this._delay);
  }

  get waiting() {
    return this._waiting;
  }

  setDelay(delay) {
    this.delay = delay;
  }

  exec(cb, force, ...params) {
    if (force) {
      this.cancel();
      // run without debounce
      cb(...params);
    }
    else {
      this._waiting = true;
      this.debouncedCb(() => {
        cb(...params);
        this._waiting = false;
      });
    }
  }

  cancel() {
    if (this.debouncedCb) this.debouncedCb.cancel();
    this._waiting = false;
  }

  flush() {
    this.debouncedCb.flush();
  }

}
