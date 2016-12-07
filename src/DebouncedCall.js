import _ from 'lodash';

import FieldState from './FieldState';

export default class FieldBase {
  constructor(delay) {
    this._delay = delay;
    this._deleyed = false;

    this.debouncedCb = _.debounce((cb) => cb(), this._delay);
  }

  get deleyed() {
    return this._deleyed;
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
      this._deleyed = true;
      this.debouncedCb(() => {
        cb(...params);
        this._deleyed = false;
      });
    }
  }

  cancel() {
    if (this.debouncedCb) this.debouncedCb.cancel();
    this._deleyed = false;
  }

  flush() {
    this.debouncedCb.flush();
  }

}
