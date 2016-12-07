import _ from 'lodash';

import FieldState from './FieldState';

export default class FieldBase {
  constructor(delay) {
    this._delay = delay;
    // waiting to call debaunced function
    this._deleyed = false;
    // if promise returned from callback has pending state
    this._pending = false;

    this.debouncedCb = _.debounce((cb) => cb(), this._delay);
  }

  get deleyed() {
    return this._deleyed;
  }

  get pending() {
    return this._pending;
  }

  setDelay(delay) {
    this.delay = delay;
  }

  exec(cb, force, ...params) {
    if (force) {
      this.cancel();
      // run without debounce
      this._runCallBack(cb, ...params);
    }
    else {
      this._deleyed = true;
      this.debouncedCb(() => {
        this._runCallBack(cb, ...params);
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

  _runCallBack(cb, ...params) {
    const promise = cb(...params);
    if (!promise) return;

    this._pending = true;
    return promise.then((data) => {
      this._pending = false;
      return data;
    }).catch((err) => {
      this._pending = false;
      return Promise.reject(err);
    });
  }
}
