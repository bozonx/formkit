const _ = require('lodash');
const { isPromise } = require('./helpers');


module.exports = class DebouncedProcess {
  constructor() {
    this._mainResolve = null;
    this._mainReject = null;
    this._mainPromise = new Promise((resolve, reject) => {
      this._mainResolve = resolve;
      this._mainReject = reject;
    });
    this._callback = null;
    // has it started at least once
    this._hasStarted = false;
    this._pending = false;
    this._waiting = false;
    // TODO: review
    this._canceled = false;
    this._onFinishCb = null;

    this._debouncedCb = null;
  }

  getPromise() {
    return this._mainPromise;
  }

  /**
   * It adds callback which will be called after fulfill or reject of promise
   */
  onFinish(cb) {
    this._onFinishCb = cb;
  }

  // TODO: не нужно - перенести в конструктор
  setCallback(cb, params) {
    if (this._hasStarted) throw new Error(`The current callback is in progress, you can't set another one.`);
    this._callback = { cb, params };
  }

  isWaiting() {
    return this._waiting;
  }

  isPending() {
    return this._pending;
  }

  // TODO: наверное не нужно
  cancel() {
    // TODO: review
    this._onFinishCb = null;
    // TODO: cancel current promise in progress
    this._pending = false;
    this._canceled = true;
  }

  start(delayTime) {
    if (this._hasStarted) {
      throw new Error(`The promise has already started, you can't start another one!`);
    }

    this._hasStarted = true;
    this._waiting = true;
    const timeMeansForce = 0;
    if (delayTime && delayTime > timeMeansForce) {
      // means regular with debounce
      // use _.debounce as a setTimeout because it can flush()
      this._debouncedCb = _.debounce(() => {
        this._waiting = false;
        this._start();
      }, delayTime);
    }
    else {
      this._waiting = false;
      // means force
      this._start();
    }
  }

  /**
   * Stop waiting and do nothing after that for ever
   */
  stop() {
    this._waiting = false;
    this._debouncedCb.cancel();
  }

  _start() {
    this._pending = true;

    const cbResult = this._callback.cb(...this._callback.params);

    // TODO: можно промис требовать обязательно чтобы упростить

    if (isPromise(cbResult)) {
      cbResult
        .then((data) => {
          this._pending = false;
          this._mainResolve();
          if (this._onFinishCb) this._onFinishCb();

          return data;
        })
        .catch((err) => {
          this._pending = false;
          this._mainReject(err);
          if (this._onFinishCb) this._onFinishCb();

          return err;
        });
    }
    else {
      this._pending = false;
      this._mainResolve();
      if (this._onFinishCb) this._onFinishCb();
    }
  }

};
