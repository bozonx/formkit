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
export default class DebouncedProcess {
  private readonly callback: () => Promise<void>;
  // has it started at least once
  private hasStarted = false;
  private pending = false;
  private waiting = false;

  constructor(cb: () => Promise<void>) {
    this.callback = cb;
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

  isWaiting() {
    return this.waiting;
  }

  isPending() {
    return this.pending;
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
    this._timeout = null;
    this.waiting = false;
  }

  /**
   * Delay start or start immediately according to delayTime
   * @param {number|undefined} delayTime - time to delay start. Undefined means start immediately.
   */
  start(delayTime) {
    if (this.hasStarted) {
      throw new Error(`The promise has already started, you can't start another one!`);
    }

    this.hasStarted = true;
    this.waiting = true;
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
    this.pending = true;
    this.waiting = false;

    this.callback()
      .then((data) => {
        this.pending = false;
        if (this._onFinishCb) this._onFinishCb();

        return data;
      })
      .catch((err) => {
        this.pending = false;
        if (this._onFinishCb) this._onFinishCb(err);

        return err;
      });
  }

}
