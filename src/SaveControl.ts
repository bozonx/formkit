import Form from './Form';
import {Values} from './FormStorage';
import {resolvePromise} from './helpers/helpers';
import DebouncedCall from './helpers/DebouncedCall';


type Handler = (values: Values) => Promise<void> | void;


export default class SaveControl {
  private readonly form: Form;
  private readonly debouncedSave: DebouncedCall;
  private handler?: Handler;


  constructor(form: Form) {
    this.form = form;
    this.debouncedSave = new DebouncedCall(this.form.config.debounceTime || 0);
  }

  getSavePromise(): Promise<void> {
    return resolvePromise(resolvePromise(this.debouncedSave.getPromise()));
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancel(): void {
    this.debouncedSave.cancel();
  }

  /**
   * SaveControl immediately
   */
  flush(): void {
    this.debouncedSave.flush();
  }

  setHandler(handler: Handler) {
    this.handler = handler;
  }

  /**
   * Check for field can be saved.
   * @return {string|void} - undefined means it can. Otherwise it returns a reason.
   */
  canSave(): string | void {
    // disallow save invalid form
    if (!this.form.valid) return `The form is invalid.`;
    if (!this.form.touched) return `The form hasn't been modified`;
  }

  async startSaving(isImmediately: boolean): Promise<void> {
    // don't run saving process if there isn't onSave callback
    if (!this.handler) return;

    const valuesBeforeSave = this.form.values;

    const promise: Promise<void> = this.debouncedSave.exec(this.doSave, isImmediately);

    // TODO: onEnd не нужнен так как есть promise

    this.debouncedSave.onEnd((error: Error | null) => {
      if (error) {
        this.form.$setState({ saving: false });
        this.form.$riseActionEvent('saveEnd', error);
      }
      else {
        const force = true;
        this.form.$setStateSilent({ saving: false });
        this.form.$moveValuesToSaveLayer(valuesBeforeSave, force);
        this.form.$riseActionEvent('saveEnd');
      }
    });

    await promise;
  }

  private doSave = (): Promise<void> => {
    this.form.$setState({ saving: true });
    // emit save start
    this.form.$riseActionEvent('saveStart');

    const valuesToSave = this.form.values;
    // run save callback
    return resolvePromise(this.handler && this.handler(valuesToSave));
  };

}
