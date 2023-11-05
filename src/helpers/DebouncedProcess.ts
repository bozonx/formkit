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
export class DebouncedProcess {
  private readonly callback: () => Promise<void>;
  // has it started at least once
  private hasStarted = false;
  private pending = false;
  private waiting = false;
  private onFinishCb: ((error: Error | null) => void) | null = null;
  // timeout to start
  // TODO: зачем null если можно использовать 0
  private timeout: any | null = null;

  constructor(cb: () => Promise<void>) {
    this.callback = cb;
  }

  /**
   * It adds callback which will be called after fulfill or reject of promise
   */
  onFinish(cb: (error: Error | null) => void): void {
    this.onFinishCb = cb;
  }

  isWaiting(): boolean {
    return this.waiting;
  }

  isPending(): boolean {
    return this.pending;
  }

  /**
   * Start immediately without timeout
   */
  flush(): void {
    if (!this.timeout) return;

    clearTimeout(this.timeout);
    this.startIt();
  }

  /**
   * Stop waiting and do nothing after that for ever.
   * It doesn't cancel callback promise if it in pending state.
   */
  stop(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
    this.waiting = false;
  }

  /**
   * Delay start or start immediately according to delayTime
   * @param {number|undefined} delayTime - time to delay start. Undefined means start immediately.
   */
  start(delayTime: number) {
    if (this.hasStarted) {
      throw new Error(`The promise has already started, you can't start another one!`);
    }

    this.hasStarted = true;
    this.waiting = true;

    const timeMeansForce = 0;

    if (delayTime > timeMeansForce) {
      // means regular with waiting to start
      this.timeout = setTimeout(() => {
        this.startIt();
      }, delayTime);
    }
    else {
      // means force
      this.startIt();
    }
  }

  private startIt() {
    this.pending = true;
    this.waiting = false;

    this.callback()
      .then((data) => {
        this.pending = false;
        if (this.onFinishCb) this.onFinishCb(null);

        return data;
      })
      .catch((err: Error) => {
        this.pending = false;
        if (this.onFinishCb) this.onFinishCb(err);

        return err;
      });
  }

}
