import Form from './Form';
import {FormEventName, Values} from './FormStorage';
import {eachFieldRecursively, resolvePromise} from './helpers/helpers';
import * as _ from 'lodash';
import Field from './Field';
import ActionEventData from './interfaces/eventData/ActionEventData';


type Handler = (values: Values, editedValues: Values) => Promise<void> | void;


export default class SubmitControl {
  private readonly form: Form;
  private handler?: Handler;


  constructor(form: Form) {
    this.form = form;
  }


  setHandler(handler: Handler) {
    this.handler = handler;
  }

  /**
   * Check for ability to form submit.
   * @return {string|void} - returns undefined if it's OK else returns a reason.
   */
  canSubmit(): string | void {
    // disallow submit invalid form
    if (!this.form.valid) return `The form is invalid.`;
    // do nothing if form is submitting at the moment
    if (this.form.submitting) return `The form is submitting now.`;

    if (!this.form.config.allowSubmitUnchangedForm) {
      if (!this.form.dirty) return `The form hasn't changed.`;
    }
  }

  async startSubmit(): Promise<void> {
    if (!this.handler) return;

    const { values, editedValues } = this.form;

    this.setState({ submitting: true });
    this.riseActionEvent('submitStart');

    // run submit callback
    await this.runSubmitHandler(this.handler, values, editedValues);
  }


  private async runSubmitHandler(
    handler: (values: Values, editedValues: Values) => Promise<void> | void,
    values: Values,
    editedValues: Values
  ): Promise<void> {
    // get result of submit handler
    const returnedPromiseOrVoid = handler(values, editedValues);

    try {
      // wait for saving process
      await resolvePromise(returnedPromiseOrVoid);
    }
    catch (error) {
      this.setState({ submitting: false });
      this.riseActionEvent('submitEnd', error);

      return;
    }

    this.afterSubmitSuccess(values);
  }


  private afterSubmitSuccess(values: Values): void {
    this.setState({ submitting: false });
    this.moveValuesToSaveLayer(values);
    this.riseActionEvent('submitEnd');
  }

  private riseActionEvent(eventName: FormEventName, error?: Error): void {
    const eventData: ActionEventData = {
      error
    };

    this.form.$emit(eventName, eventData);
  }

  private moveValuesToSaveLayer(values: Values, force?: boolean): void {
    this.updateStateAndValidate(() => {
      eachFieldRecursively(this.form.fields, (field: Field, pathToField: string) => {
        const savedValue = _.get(values, pathToField);

        field.$setValueAfterSave(savedValue);
      });
    }, force);
  }

}
