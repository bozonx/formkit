import _ from 'lodash';

export default class DebouncedCall {
  constructor(delay) {
    this._delay = delay;
    // waiting to call debaunced function
    this._deleyed = false;
    // if promise returned from callback has pending state
    this._pending = false;
    this._runAfterCbFulfill = undefined;

    this._debouncedCb = _.debounce((cb) => cb(), this._delay);
  }

  get deleyed() {
    return this._deleyed;
  }

  get pending() {
    return this._pending;
  }

  get delay() {
    return this.delay;
  }
  set delay(delay) {
    this.delay = delay;
  }

  exec(cb, force, ...params) {
    if (this._pending) {
      this._runAfterCbFulfill = {cb, params: [...params]};
      return;
    }

    if (force) {
      this.cancel();
      // run without debounce
      this._runCallBack(cb, ...params);
    }
    else {
      this._deleyed = true;
      this._debouncedCb(() => {
        this._runCallBack(cb, ...params);
        this._deleyed = false;
      });
    }
  }

  cancel() {
    if (this._debouncedCb) this._debouncedCb.cancel();
    this._deleyed = false;
    // TODO: а если уже сохранение в процессе???
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
