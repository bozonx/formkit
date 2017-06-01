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
    if (this._debouncedCb) this._debouncedCb.cancel();
    // TODO: cancel current promise in progress
    // TODO: remove cb in queue
    // if (this._cbWrapper) this._cbWrapper.cancel();
    this._delayed = false;
  }

  flush() {
    this._debouncedCb.flush();
  }


  exec(cb, force, ...params) {
    this._setCallbackWrapper(cb, params, force);

    return this._cbWrapper.getPromise();
  }

  _setCallbackWrapper(cb, params, force) {
    if (this._cbWrapper) {
      if (this._cbWrapper.isFulfilled()) {
        this._runFreshCb(cb, params, force);
      }
      else if (this._cbWrapper.isStarted()) {
        // set this callback in queue
        this._queuedCallback = { cb, params };
      }
      else {
        // replace callback if it hasn't run.
        this._cbWrapper.setCallback(cb, params);
      }
    }
    else {
      this._runFreshCb(cb, params, force);
    }
  }

  _runFreshCb(cb, params, force) {
    // set new callback wrapper;
    this._cbWrapper = new DebouncedCallbackWrapper();
    this._cbWrapper.setCallback(cb, params);

    // after save promise was saved - remove cbWrapper
    this._cbWrapper.getPromise().then(() => this._runQueuedCb(), (err) => {
      this._runQueuedCb();

      return err;
    });

    this._startDebounced(force);
  }

  _runQueuedCb() {
    if (this._queuedCallback) {
      this._runFreshCb(this._queuedCallback.cb, this._queuedCallback.params, true);
      this._queuedCallback = null;
    }
  }

  _startDebounced(force) {
    if (force) {
      // TODO: наверное тут нужно отменить только delayed, но не промисы
      this.cancel();
      // run without debounce
      this._delayed = true;
      this._cbWrapper.start();
      this._delayed = false;
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

}
