import _ from 'lodash';

/**
 *
 */
export default class DebouncedCallbackWrapper {
  constructor() {
    this._resolve = null;
    this._reject = null;
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    this._cb = null;
    this._cbParams = [];
    this._cbPromise = null;
    this._started = false;
    this._pending = false;
  }

  getPromise() {
    return this._promise;
  }

  setCallback(cb, ...params) {
    this._cb = cb;
    this._cbParams = params;
    // TODO: либо отклонять те что в процессе, либо отменять их результат и запускать заного
  }

  isPending() {
    return this._pending;
  }

  isStarted() {
    return this._started;
  }

  cancel() {
    // TODO: отменить результат если уже выполняется
  }

  start() {
    if (!this._cb) throw new Error(`There isn't a callback to run!`);

    this._started = true;
    this._pending = true;

    this._cbPromise = this._cb(...this._cbParams);
    if (!_.has(this._cbPromise, 'then')) {
      this._cbPromise = Promise.resolve();
    }

    this._cbPromise.then((data) => {
      this._afterCbFulfilled();

      return data;
    }).catch((err) => {
      this._afterCbError();

      return Promise.reject(err);
    });
  }

  _afterCbFulfilled() {
    this._pending = false;
    this._resolve();
    // if (this._runAfterCbFulfill) {
    //   this.exec(this._runAfterCbFulfill.cb, true, ...this._runAfterCbFulfill.params);
    //   this._runAfterCbFulfill = undefined;
    // }
  }

  _afterCbError() {
    this._pending = false;
    this._reject();
  }

}
