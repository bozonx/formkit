import _ from 'lodash';

import DebouncedCallbackWrapper from './DebouncedCallbackWrapper';

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
    // waiting for start
    this._delayed = false;
    // promise which wait while current callback has run and fulfilled.
    // this._waitPromise = null;
    this._debouncedCb = _.debounce((cb) => cb(), this._delayTime);
    this._cbWrapper = null;
    // callback which was added while current callback in progress
    this._queuedCallback = null;
  }

  getDelayed() {
    return this._delayed;
  }

  getPending() {
    if (!this._cbWrapper) return false;

    return this._cbWrapper.isPending();
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

  _cancelDelayed() {
    if (this._debouncedCb) this._debouncedCb.cancel();
    this._delayed = false;
  }

  _cancelQueue() {
    this._queuedCallback = null;
  }

  flush() {
    this._debouncedCb.flush();
  }


  exec(cb, force, ...params) {
    this._chooseTheWay(cb, params, force);

    return this._cbWrapper.getPromise();
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
      else {
        // replace callback if it hasn't run.
        this._cbWrapper.setCallback(cb, params);

        this._cancelDelayed();
        this._runWithoutDebounce();
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
      // TODO: впринципе можно использовать и timeout / clearTimeout
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

    // after save promise was saved - run cb in queue
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

}
