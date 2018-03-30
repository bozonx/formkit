const _ = require('lodash');
const BbPromise = require('bluebird');
const DebouncedProcess = require('./DebouncedProcess');


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
    // current callback which is waiting or in progress
    this._currentProcess = null;
    this._nextCbWaitPromise = null;
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
   * * cancel callback which is executing
   */
  cancel() {
    this._clearQueue();
    this._stopDelayed();

    // TODO: нужно ли отменять выполняющийся колбэк?
    //if (this._currentProcess) this._currentProcess.cancel();

    this._currentProcess = null;
  }

  /**
   * Run immediately callback which is waiting for start.
   */
  flush() {
    if (this._currentProcess) this._currentProcess.flush();
  }

  /**
   * Add callback to execution.
   * if force = false
   * * if there isn't executing or waiting callback - it start to wait to execute this callback
   * * if there is executing or waiitng callback - it add this to queue.
   * if force = true
   * * if there isn't executing or waiting callback - it runs this callback immediately
   * * if there is executing or waiitng callback - it cancels waiting or executing callback
   *   and run this immediately
   * @param {function} cb - your callback which will be executed
   * @param {boolean} force - if true - cancel current callback and run immediately
   * @param {array} params - params of callback
   * @return {Promise} - It will be fulfilled at the end after waiting and executing
   */
  exec(cb, force = false, ...params) {
    this._chooseTheWay(cb, params, force);

    // TODO: ??? какой промис возвращаем, если колбэк может поставиться в очередь???
    return this._currentProcess.getPromise();
  }

  _clearQueue() {
    this._nextCbWaitPromise = null;
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
        this._addToQueueForce(cb, params);
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
        this._addToQueueRegular(cb, params);
      }
      else {
        throw new Error(`Something wrong`);
      }
    }
  }

  _runFreshProcess(cb, params, delayTime) {
    this._clearQueue();
    this._stopDelayed();

    this._currentProcess = new DebouncedProcess();
    // after current promise was finished - run next cb in queue
    this._currentProcess.onFinish(() => this._afterCbFinished());
    this._currentProcess.setCallback(cb, params);
    this._currentProcess.start(delayTime);
  }

  _addToQueueRegular(cb, params) {
    if (this._nextCbWaitPromise) this._nextCbWaitPromise.cancel();

    this._nextCbWaitPromise = new BbPromise((resolve, reject, onCancel) => {
      const queueTimeout = setTimeout(() => {
        resolve({ cb, params });
      }, this._delayTime);

      onCancel(() => {
        clearTimeout(queueTimeout);
      });
    });
  }

  _addToQueueForce(cb, params) {
    if (this._nextCbWaitPromise) this._nextCbWaitPromise.cancel();

    this._nextCbWaitPromise = BbPromise.resolve({ cb, params });
  }

  _afterCbFinished() {
    if (this._nextCbWaitPromise) {
      // run queue
      this._nextCbWaitPromise
        // run next process as new one with force
        .then(({ cb, params }) => this._runFreshProcess(cb, params));

      return;
    }

    // if there isn't any queue - just finish and go to beginning
    this._currentProcess = null;
  }

};
