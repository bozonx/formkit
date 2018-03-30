const { isPromise } = require('./helpers');


module.exports = class DebouncedCallbackWrapper {
  constructor() {
    this._mainResolve = null;
    this._mainReject = null;
    this._mainPromise = new Promise((resolve, reject) => {
      this._mainResolve = resolve;
      this._mainReject = reject;
    });
    this._callback = null;
    // this._cbPromise = null;
    this._started = false;
    this._pending = false;
    this._canceled = false;
    this._afterDone = null;
  }

  getPromise() {
    return this._mainPromise;
  }

  /**
   * It adds callback which will be called after fulfill or reject of promise
   */
  afterDone(cb) {
    this._afterDone = cb;
  }

  setCallback(cb, params) {
    if (this._started) throw new Error(`The current callback is in progress, you can't set another one.`);
    this._callback = { cb, params };
  }

  isPending() {
    return this._pending;
  }

  isStarted() {
    return this._started;
  }

  isFulfilled() {
    return this.isStarted() && !this.isPending() && !this._canceled;
  }

  isCanceled() {
    // TODO: ??? why??
    return this._canceled;
  }

  cancel() {
    this._afterDone = null;
    // TODO: cancel current promise in progress
    this._pending = false;
    this._canceled = true;
  }

  start(delayTime) {
    // TODO: add debounce

    if (delayTime && delayTime > 0) {
      // means regular with debounce

    }
    else {
      // means force
    }

    // this._debouncedCb(() => {
    //   if (this._currentProcess) this._currentProcess.start();
    // });
  }

  /**
   * Stop waiting and do nothing after that for ever
   */
  stop() {

  }

  oldStart() {

    // TODO: add _afterDone

    if (!this._callback) throw new Error(`There isn't a callback to run!`);
    if (this.isFulfilled()) throw new Error(`The promise was fulfilled, you can't start another one!`);

    this._started = true;
    this._pending = true;

    const cbPromise = this._callback.cb(...this._callback.params);
    if (isPromise(cbPromise)) {
      cbPromise.then((data) => {
        this._pending = false;
        this._mainResolve();

        return data;
      }, (err) => {
        this._pending = false;
        this._mainReject(err);

        return err;
      });
    }
    else {
      this._pending = false;
      this._mainResolve();
    }
  }

};
