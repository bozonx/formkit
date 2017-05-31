import _ from 'lodash';

/**
 * It allows run callback with delay with debounce.
 * * If callback returns a promise
 *   * the callback running will be delayed for a specific time
 *   * The "delayed" and "pending" prop will be true
 *   * If you try to call another callback while current callback is waiting
 *     for running and promise fulfilling,
 *     it will delay it and call it after current callback has fulfilled.
 *   * After promise has fulfiled, the "pending" prop will bi false.
 * * If callback returns an undefined:
 *   * the callback running will be delayed for a specific time
 *   * The "delayed" prop will be true
 *   * If you try to call another callback while current callback is waiting for running,
 *     it will delay it and call it after current callback has fulfilled.
 */
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
    // TODO: ??? review
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
    // TODO: why return???
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
