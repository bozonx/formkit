const _ = require('lodash');
const { isPromise } = require('./helpers');


/**
 * It wraps logic of debounced call of callback.
 * After start it:
 * if with delay
 * * waiting for start and switch to waiting state
 * * then start and switch to pending state
 * * after callback has resolved or rejected - it call onFinish callback
 * if force - the same but without waiting state
 * While callback is waiting you can stop it by calling stop()
 * But if it pending you can't cancel it.
 */
module.exports = class DebouncedProcess {
  constructor() {
    this._callback = null;
    // has it started at least once
    this._hasStarted = false;
    this._pending = false;
    this._waiting = false;
    // TODO: review
    this._canceled = false;
    this._onFinishCb = null;
    // timeout to start
    this._timeout = null;
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

  flush() {
    if (!this._timeout) return;

    clearTimeout(this._timeout);
    this._start();
  }

  /**
   * Stop waiting and do nothing after that for ever.
   * It doesn't cancel callback promise if it in pending state.
   */
  stop() {
    if (this._timeout) clearTimeout(this._timeout);
    this._waiting = false;
  }

  /**
   * Delay start or start immediately according to delayTime
   * @param {number|undefined} delayTime - time to delay start. Undefined means start immediately.
   */
  start(delayTime) {
    if (this._hasStarted) {
      throw new Error(`The promise has already started, you can't start another one!`);
    }

    this._hasStarted = true;
    this._waiting = true;
    const timeMeansForce = 0;
    if (delayTime && delayTime > timeMeansForce) {
      // means regular with waiting to start
      this._timeout = setTimeout(() => {
        this._start();
      }, delayTime);
    }
    else {
      // means force
      this._start();
    }
  }

  _start() {
    this._pending = true;
    this._waiting = false;

    const cbResult = this._callback.cb(...this._callback.params);

    // TODO: можно промис требовать обязательно чтобы упростить

    if (isPromise(cbResult)) {
      cbResult
        .then((data) => {
          this._pending = false;
          if (this._onFinishCb) this._onFinishCb();

          return data;
        })
        .catch((err) => {
          this._pending = false;
          if (this._onFinishCb) this._onFinishCb();

          return err;
        });
    }
    else {
      this._pending = false;
      if (this._onFinishCb) this._onFinishCb();
    }
  }

};
