import Form from './Form';
import {Values} from './FormStorage';
import {resolvePromise} from './helpers/helpers';


type Handler = (values: Values) => Promise<void> | void;


export default class SaveControl {
  private handler?: Handler;


  constructor(form: Form) {

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
    if (!this.valid) return `The form is invalid.`;
    if (!this.touched) return `The form hasn't been modified`;
  }



  async startSaving(isImmediately: boolean): Promise<void> {
    // don't run saving process if there isn't onSave callback
    if (!this.handlers.onSave) return;

    const valuesBeforeSave = this.values;

    const promise: Promise<void> = this.debouncedSave.exec(this.doSave, isImmediately);

    // TODO: onEnd не нужнен так как есть promise

    this.debouncedSave.onEnd((error: Error | null) => {
      if (error) {
        this.setState({ saving: false });
        this.riseActionEvent('saveEnd', error);
      }
      else {
        const force = true;
        this.$setStateSilent({ saving: false });
        this.moveValuesToSaveLayer(valuesBeforeSave, force);
        this.riseActionEvent('saveEnd');
      }
    });

    await promise;
  }

  private doSave = (): Promise<void> => {
    this.setState({ saving: true });
    // emit save start
    this.riseActionEvent('saveStart');

    // run save callback
    const cbResult: Promise<void> | void = this.handlers.onSave && this.handlers.onSave(this.values);

    return resolvePromise(cbResult);
  };

}
