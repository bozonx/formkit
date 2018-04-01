const _ = require('lodash');
const DebouncedProcess = require('./DebouncedProcess');


/**
 * It allows run callback with delay and debounce.
 * * running of callback will be delayed for a specified time
 * * If you try to add another callback while current callback is waiting
 *   it replaces current callback.
 * * if you add one another callback while current callback is in progress,
 *   this new callback will be called after current has fulfilled.
 * * also you can force run callback and it runs immediately
 *   and resets currently delayed callback
 */
module.exports = class DebouncedCall {
  constructor(delayTime) {
    this.setDebounceTime(delayTime);
    // current callback which is waiting or in progress
    this._currentProcess = null;
    this._nextCb = null;
    // promise of end of saving process
    this._mainPromise = null;
    this._mainResolve = null;
  }

  /**
   * Delayed means - callback is waiting for run.
   * It is true until delayed time is up and callback will run.
   * @return {boolean}
   */
  isWaiting() {
    if (!this._currentProcess) return false;

    return this._currentProcess.isWaiting();
  }

  /**
   * Pending means - callback is in progress.
   * It is true from callback has started and until callback's promise will be fulfilled.
   * @return {*}
   */
  isPending() {
    if (!this._currentProcess) return false;

    return this._currentProcess.isPending();
  }

  /**
   * delayed or pending
   * @return {boolean}
   */
  isInProgress() {
    return this.isWaiting() || this.isPending();
  }

  setDebounceTime(delayTime) {
    this._delayTime = delayTime;
  }

  /**
   * Cancel:
   * * callback which waiting
   * * cancel call callback which is next
   * It doesn't cancel currently executing callback
   */
  cancel() {
    this._clearQueue();
    this._stopDelayed();
  }

  /**
   * Run immediately callback which is waiting for start.
   */
  flush() {
    if (this._currentProcess) this._currentProcess.flush();
  }

  /**
   * Add callback to execution.
   * It starts after delay or immediately if force or after current executing callback.
   * @param {function} cb - your callback which will be executed
   * @param {boolean} force - if true - cancel current callback and run immediately
   * @param {array} params - params of callback
   * @return {Promise} - promise of end of save cycle.
   *                     It will be fulfilled event a new one replaces current promise.
   */
  exec(cb, force = false, ...params) {
    if (!this._mainPromise) {
      this._mainResolve = null;
      this._mainPromise = new Promise((resolve) => {
        this._mainResolve = resolve;
      });
    }

    this._chooseTheWay(cb, params, force);

    return this._mainPromise;
  }

  _clearQueue() {
    this._nextCb = null;
  }

  _stopDelayed() {
    if (!this._currentProcess) return;

    this._currentProcess.stop();
    this._currentProcess = null;
  }

  _chooseTheWay(cb, params, force) {
    if (force) {
      // run fresh new process it there isn't any or some process is waiting
      if (!this._currentProcess || this.isWaiting()) {
        // it hasn't been doing anything
        this._runFreshProcess(cb, params);
      }
      else if (this.isPending()) {
        this._addToQueue(cb, params);
      }
      else {
        throw new Error(`Something wrong`);
      }
    }
    else {
      // run fresh new process it there isn't any or some process is waiting
      if (!this._currentProcess || this.isWaiting()) {
        // it hasn't been doing anything
        this._runFreshProcess(cb, params, this._delayTime);
      }
      else if (this.isPending()) {
        this._addToQueue(cb, params, this._delayTime);
      }
      else {
        throw new Error(`Something wrong`);
      }
    }
  }

  _runFreshProcess(cb, params, delayTime) {
    this._clearQueue();
    this._stopDelayed();

    this._currentProcess = new DebouncedProcess(cb, params);
    // after current promise was finished - run next cb in queue
    this._currentProcess.onFinish(() => this._afterCbFinished());
    this._currentProcess.start(delayTime);
  }

  _addToQueue(cb, params, delayTime) {
    this._nextCb = [ cb, params, delayTime ];
  }

  _afterCbFinished() {
    if (this._nextCb) {
      const cbParams = this._nextCb;
      this._nextCb = null;
      this._currentProcess = null;
      this._runFreshProcess(...cbParams);
    }
    else {
      // if there isn't any queue - just finish and go to beginning
      this._currentProcess = null;
      this._mainResolve();
      this._mainPromise = null;
      this._mainResolve = null;
    }
  }

};
