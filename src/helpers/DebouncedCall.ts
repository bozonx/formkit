import DebouncedProcess from './DebouncedProcess';


type NextCb = [ () => void, number | undefined ];


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
  private nextCb: NextCb | null = null;
  private onEndCb: (() => void) | null = null;
  // promise of end of saving process
  private mainPromise: Promise<void> | null = null;
  private mainResolve: (() => void) | null = null;
  private delayTime: number = 0;

  constructor(delayTime: number) {
    this.setDebounceTime(delayTime);
  }

  getPromise(): Promise<void> | null {
    return this.mainPromise;
  }

  /**
   * Delayed means - callback is waiting for run.
   * It is true until delayed time is up and callback will run.
   * @return {boolean}
   */
  isWaiting(): boolean {
    if (!this.currentProcess) return false;

    return this.currentProcess.isWaiting();
  }

  /**
   * Pending means - callback is in progress.
   * It is true from callback has started and until callback's promise will be fulfilled.
   * @return {*}
   */
  isPending(): boolean {
    if (!this.currentProcess) return false;

    return this.currentProcess.isPending();
  }

  /**
   * delayed or pending
   * @return {boolean}
   */
  isInProgress(): boolean {
    return this.isWaiting() || this.isPending();
  }

  setDebounceTime(delayTime: number): void {
    this.delayTime = delayTime;
  }

  /**
   * Cancel:
   * * callback which waiting
   * * cancel call callback which is next
   * It doesn't cancel currently executing callback
   */
  cancel(): void {
    this.clearQueue();
    this.stopDelayed();
  }

  /**
   * Run immediately callback which is waiting for start.
   */
  flush(): void {
    if (this.currentProcess) this.currentProcess.flush();
  }

  onEnd(cb: () => void): void {
    this.onEndCb = cb;
  }

  /**
   * Add callback to execution.
   * It starts after delay or immediately if force or after current executing callback.
   * @param {function} cb - your callback which will be executed
   * @param {boolean} force - if true - cancel current callback and run immediately
   * @return {Promise} - promise of end of save cycle.
   *                     It will be fulfilled event a new one replaces current promise.
   */
  exec(cb: () => void, force: boolean = false): Promise<void> {
    if (!this.mainPromise) {
      this.mainResolve = null;
      this.mainPromise = new Promise((resolve: () => void) => {
        this.mainResolve = resolve;
      });
    }

    this.chooseTheWay(cb, force);

    return this.mainPromise;
  }

  private clearQueue(): void {
    this.nextCb = null;
  }

  private stopDelayed(): void {

    // TODO: rename to stopCurrent ???

    if (!this.currentProcess) return;

    this.currentProcess.stop();
    this.currentProcess = null;
  }

  private chooseTheWay(cb: () => void, force: boolean): void {
    if (force) {
      // run fresh new process it there isn't any or some process is waiting
      if (!this.currentProcess || this.isWaiting()) {
        // it hasn't been doing anything
        this.runFreshProcess(cb);
      }
      else if (this.isPending()) {
        this.addToQueue(cb);
      }
      else {
        throw new Error(`Something wrong`);
      }
    }
    else {
      // run fresh new process it there isn't any or some process is waiting
      if (!this.currentProcess || this.isWaiting()) {
        // it hasn't been doing anything
        this.runFreshProcess(cb, this.delayTime);
      }
      else if (this.isPending()) {
        this.addToQueue(cb, this.delayTime);
      }
      else {
        throw new Error(`Something wrong`);
      }
    }
  }

  private runFreshProcess(cb: () => Promise<void>, delayTime?: number): void {
    this.clearQueue();
    this.stopDelayed();

    this.currentProcess = new DebouncedProcess(cb);
    // after current promise was finished - run next cb in queue
    this.currentProcess.onFinish((err) => this.afterCbFinished(err));
    this.currentProcess.start(delayTime || 0);
  }

  private addToQueue(cb: () => void, delayTime?: number): void {
    this.nextCb = [ cb, delayTime ];
  }

  private afterCbFinished(err): void {
    if (this.nextCb) {
      const nextCb: NextCb = this.nextCb;
      this.nextCb = null;
      this.currentProcess = null;
      this.runFreshProcess(...nextCb);
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
