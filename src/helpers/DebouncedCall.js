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
    // current callback which is waiting or in progress
    this._currentProcess = null;
    // callback which was added while current callback in progress
    this._queuedProcess = null;

    // promise which wait while current callback has run and fulfilled.
    //this._waitPromise = null;
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
   * It is true from callback has started and until callback's promise will be fulfilled.
   * @return {*}
   */
  getPending() {
    if (!this._currentProcess) return false;

    return this._currentProcess.isPending();
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

  /**
   * Cancel:
   * * callback which waiting
   * * cancel call callback which is next
   * * cancel callback which is executing
   */
  cancel() {
    this._cancelDelayed();
    this._cancelQueue();
    if (this._currentProcess) this._currentProcess.cancel();

    // TODO: надо очистить this._currentProcess
  }

  /**
   * Run immediately callback which is waiting for start.
   */
  flush() {
    if (this._debouncedCb) this._debouncedCb.flush();
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

    return this._currentProcess.getPromise();
  }

  /**
   * Cancel waiting for start next cb
   * @private
   */
  _cancelDelayed() {
    if (this._debouncedCb) this._debouncedCb.cancel();
    this._delayed = false;
  }

  _cancelQueue() {
    this._queuedProcess = null;
  }

  _chooseTheWay(cb, params, force) {
    if (this._currentProcess) {
      // add to queue

      // TODO: remove isCanceled
      // TODO: не должно быть isFulfilled - он должен сразу очиститься

      // TODO: эту часть вооще убрать
      if (this._currentProcess.isFulfilled() || this._currentProcess.isCanceled()) {
        this._runFreshCb(cb, params, force);
      }

      // TODO: почуму isStarted а не pending?
      else if (this._currentProcess.isStarted()) {
        this._addToQueue(cb, params);
      }
      else if (force) {
        // replace callback if it hasn't run.
        // TODO: нужно отменить всё в том числе и то что в очереди
        this._cancelDelayed();
        // TODO: нужно немедленно выполнить - пересоздать новый враппер и сразу его выполнить
        this._currentProcess.setCallback(cb, params);
        this._runWithoutDebounce();
      }
      else {
        // replace promise which is waiting and start waiting from the beginning
        // TODO: полностью пересоздать wrapper
        this._currentProcess.setCallback(cb, params);
      }
    }
    else {
      // add new
      this._runFreshCb(cb, params, force);
    }
  }

  _runFreshCb(cb, params, force) {

    // TODO: переделать

    this._setupNewCbWrapper(cb, params, force);

    if (force) {
      this._runWithoutDebounce();
    }
    else {
      // run debounced
      this._delayed = true;
      // TODO: may be use timeout / clearTimeout instead?
      this._debouncedCb(() => {
        if (this._currentProcess) this._currentProcess.start();
        this._delayed = false;
      });
    }
  }

  _runWithoutDebounce() {

    // TODO: переделать

    // run without debounce
    this._delayed = true;
    this._currentProcess.start();
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

    // TODO: переделать

    // set new callback wrapper;
    this._currentProcess = new DebouncedCallbackWrapper();
    this._currentProcess.setCallback(cb, params);

    // after current promise was finished - run next cb in queue
    this._currentProcess.getPromise().then(() => this._runQueuedCb(), (err) => {
      this._runQueuedCb();

      return err;
    });
  }

  _addToQueue(cb, params) {
    this._queuedProcess = { cb, params };
  }

  _runQueuedCb() {

    // TODO: review

    if (this._queuedProcess) {
      this._runFreshCb(this._queuedProcess.cb, this._queuedProcess.params, true);
      // remove queue
      this._cancelQueue();
    }
  }

};
