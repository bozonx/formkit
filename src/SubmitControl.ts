import Form from './Form';
import {FormEventName, Values} from './FormStorage';
import {eachFieldRecursively, resolvePromise} from './helpers/helpers';
import * as _ from 'lodash';
import Field from './Field';
import ActionEventData from './interfaces/eventData/ActionEventData';


type Handler = (values: Values, editedValues: Values) => Promise<void> | void;


export default class SubmitControl {
  private handler?: Handler;


  constructor(form: Form) {

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
    if (!this.valid) return `The form is invalid.`;
    // do nothing if form is submitting at the moment
    if (this.submitting) return `The form is submitting now.`;

    if (!this.config.allowSubmitUnchangedForm) {
      if (!this.dirty) return `The form hasn't changed.`;
    }
  }

  async startSubmit(): Promise<void> {
    if (!this.handlers.onSubmit) return;

    const { values, editedValues } = this;

    this.setState({ submitting: true });
    this.riseActionEvent('submitStart');

    // run submit callback
    await this.runSubmitHandler(this.handlers.onSubmit, values, editedValues);
  }


  private async runSubmitHandler(
    cb: (values: Values, editedValues: Values) => Promise<void> | void,
    values: Values,
    editedValues: Values
  ): Promise<void> {
    // get result of submit handler
    const returnedPromiseOrVoid = cb(values, editedValues);

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

    this.$emit(eventName, eventData);
  }

  private moveValuesToSaveLayer(values: Values, force?: boolean): void {
    this.updateStateAndValidate(() => {
      eachFieldRecursively(this.fields, (field: Field, pathToField: string) => {
        const savedValue = _.get(values, pathToField);

        field.$setValueAfterSave(savedValue);
      });
    }, force);
  }

}
