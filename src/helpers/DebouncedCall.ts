import DebouncedProcess from './DebouncedProcess';


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
export default class DebouncedCall {
  private currentProcess: DebouncedProcess | null = null;
  // current callback which is waiting or in progress
  private nextCb: (() => void) | null = null;
  private onEndCb: (() => void) | null = null;
  // promise of end of saving process
  private mainPromise: Promise<void> | null = null;
  private mainResolve: (() => void) | null = null;

  constructor(delayTime: number) {
    this.setDebounceTime(delayTime);
  }

  getPromise() {
    return this.mainPromise;
  }

  /**
   * Delayed means - callback is waiting for run.
   * It is true until delayed time is up and callback will run.
   * @return {boolean}
   */
  isWaiting() {
    if (!this.currentProcess) return false;

    return this.currentProcess.isWaiting();
  }

  /**
   * Pending means - callback is in progress.
   * It is true from callback has started and until callback's promise will be fulfilled.
   * @return {*}
   */
  isPending() {
    if (!this.currentProcess) return false;

    return this.currentProcess.isPending();
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
    if (this.currentProcess) this.currentProcess.flush();
  }

  onEnd(cb) {
    this.onEndCb = cb;
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
    if (!this.mainPromise) {
      this.mainResolve = null;
      this.mainPromise = new Promise((resolve) => {
        this.mainResolve = resolve;
      });
    }

    this._chooseTheWay(cb, params, force);

    return this.mainPromise;
  }

  _clearQueue() {
    this.nextCb = null;
  }

  _stopDelayed() {
    if (!this.currentProcess) return;

    this.currentProcess.stop();
    this.currentProcess = null;
  }

  _chooseTheWay(cb, params, force) {
    if (force) {
      // run fresh new process it there isn't any or some process is waiting
      if (!this.currentProcess || this.isWaiting()) {
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
      if (!this.currentProcess || this.isWaiting()) {
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

    this.currentProcess = new DebouncedProcess(cb, params);
    // after current promise was finished - run next cb in queue
    this.currentProcess.onFinish((err) => this._afterCbFinished(err));
    this.currentProcess.start(delayTime);
  }

  _addToQueue(cb, params, delayTime) {
    this.nextCb = [ cb, params, delayTime ];
  }

  _afterCbFinished(err) {
    if (this.nextCb) {
      const cbParams = this.nextCb;
      this.nextCb = null;
      this.currentProcess = null;
      this._runFreshProcess(...cbParams);
    }
    else {
      // if there isn't any queue - just finish and go to beginning
      this.currentProcess = null;
      this.mainResolve(err);
      if (this.onEndCb) this.onEndCb(err);
      this.mainPromise = null;
      this.mainResolve = null;
      this.onEndCb = null;
    }
  }

}
