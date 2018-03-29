const _ = require('lodash');
const DebouncedCallbackWrapper = require('./DebouncedCallbackWrapper');


/**
 * It allows run callback with delay and debounce.
 * * If callback returns a promise
 *   * running of callback will be delayed for a specified time
 *   * "delayed" will be true until callback starts
 *   * "pending" will be true after callback starts until it ends
 *   * If you try to call another callback while current callback is waiting for running or in progress,
 *     it will delay it and call it after current callback has fulfilled.
 *   * After promise has fulfiled, the "pending" prop will be false.
 * * If callback returns an undefined:
 *   * running of callback will be delayed for a specified time
 *   * "delayed" will be true until callback starts
 *   * If you try to call another callback while current callback is waiting for running,
 *     it will delay it and call it after current callback has fulfilled.
 * * if you add one another callback while current callback is waitng or in progress,
 *   it will replace that callback which is in queue.
 * * also you can force run callback and it runs immediately
 *   and reset currently delayed or executed callback
 */
module.exports = class DebouncedCall {
  constructor(delayTime) {
    this.setDebounceTime(delayTime);
    // waiting for start
    this._delayed = false;

    // promise which wait while current callback has run and fulfilled.
    // this._waitPromise = null;

    this._cbWrapper = null;
    // callback which was added while current callback in progress
    this._queuedCallback = null;
  }

  /**
   * Delayed means - callback is waiting for run.
   * It is true until delayed time is up and callback will run.
   * @return {boolean}
   */
  getDelayed() {
    return this._delayed;
  }

  /**
   * Pending means - callback is in progress.
   * It is true until callback's promise will be fulfilled.
   * @return {*}
   */
  getPending() {
    if (!this._cbWrapper) return false;

    return this._cbWrapper.isPending();
  }

  setDebounceTime(delayTime) {
    this._delayTime = delayTime;
    this._debouncedCb = _.debounce((cb) => cb(), this._delayTime);
  }

  /**
   * delayed or pending
   * @return {boolean}
   */
  isInProgress() {
    return this.getDelayed() || this.getPending();
  }

  cancel() {
    this._cancelDelayed();
    this._cancelQueue();
    if (this._cbWrapper) this._cbWrapper.cancel();
  }

  flush() {
    this._debouncedCb.flush();
  }

  exec(cb, force, ...params) {
    this._chooseTheWay(cb, params, force);

    return this._cbWrapper.getPromise();
  }

  _cancelDelayed() {
    if (this._debouncedCb) this._debouncedCb.cancel();
    this._delayed = false;
  }

  _cancelQueue() {
    this._queuedCallback = null;
  }

  _chooseTheWay(cb, params, force) {
    if (this._cbWrapper) {
      if (this._cbWrapper.isFulfilled() || this._cbWrapper.isCanceled()) {
        this._runFreshCb(cb, params, force);
      }
      else if (this._cbWrapper.isStarted()) {
        // set this callback in queue
        this._queuedCallback = { cb, params };
      }
      else if (force) {
        // replace callback if it hasn't run.
        this._cancelDelayed();
        this._cbWrapper.setCallback(cb, params);
        this._runWithoutDebounce();
      }
      else {
        this._cbWrapper.setCallback(cb, params);
      }
    }
    else {
      this._runFreshCb(cb, params, force);
    }
  }

  _runFreshCb(cb, params, force) {
    this._setupNewCbWrapper(cb, params, force);

    if (force) {
      this._runWithoutDebounce();
    }
    else {
      // run debounced
      this._delayed = true;
      // TODO: may be use timeout / clearTimeout instead?
      this._debouncedCb(() => {
        if (this._cbWrapper) this._cbWrapper.start();
        this._delayed = false;
      });
    }
  }

  _runWithoutDebounce() {
    // run without debounce
    this._delayed = true;
    this._cbWrapper.start();
    this._delayed = false;
  }

  /**
   * Set new callback wrapper.
   * There aren't promise in progress and waiting queue and delayed cb on moment of running the method.
   * @param cb
   * @param params
   * @private
   */
  _setupNewCbWrapper(cb, params) {
    // set new callback wrapper;
    this._cbWrapper = new DebouncedCallbackWrapper();
    this._cbWrapper.setCallback(cb, params);

    // after current promise was finished - run next cb in queue
    this._cbWrapper.getPromise().then(() => this._runQueuedCb(), (err) => {
      this._runQueuedCb();

      return err;
    });
  }

  _runQueuedCb() {
    if (this._queuedCallback) {
      this._runFreshCb(this._queuedCallback.cb, this._queuedCallback.params, true);
      // remove queue
      this._cancelQueue();
    }
  }

};
