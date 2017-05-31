import _ from 'lodash';

export default class DebouncedCall {
  constructor(delayTime) {
    this._delayTime = delayTime;
    // waiting for a calling of debounced function
    this._delayed = false;
    // if promise returned from callback has pending state
    this._pending = false;
    this._runAfterCbFulfill = undefined;

    this._debouncedCb = _.debounce((cb) => cb(), this._delayTime);
  }

  getDelayed() {
    return this._delayed;
  }
  getPending() {
    return this._pending;
  }

  exec(cb, force, ...params) {
    if (this._pending) {
      this._runAfterCbFulfill = { cb, params: [ ...params ] };

      return;
    }

    if (force) {
      this.cancel();
      // run without debounce
      this._runCallBack(cb, ...params);
    }
    else {
      this._delayed = true;
      this._debouncedCb(() => {
        this._runCallBack(cb, ...params);
        this._delayed = false;
      });
    }
  }

  cancel() {
    if (this._debouncedCb) this._debouncedCb.cancel();
    this._delayed = false;
  }

  flush() {
    this._debouncedCb.flush();
  }

  _runCallBack(cb, ...params) {
    const promise = cb(...params);
    if (!promise) return;

    this._pending = true;

    return promise.then((data) => {
      this._pending = false;
      if (this._runAfterCbFulfill) {
        this.exec(this._runAfterCbFulfill.cb, true, ...this._runAfterCbFulfill.params);
        this._runAfterCbFulfill = undefined;
      }

      return data;
    }).catch((err) => {
      this._pending = false;

      return Promise.reject(err);
    });
  }
}
