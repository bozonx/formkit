import {Form} from './Form.js'
import {resolvePromise} from './helpers/helpers.js'
import type {Values} from './types/types.js'
import {FormEvent} from './types/FormTypes.js';


type Handler = (values: Values, editedValues: Values) => Promise<void> | void


export class SubmitControl {
  private readonly form: Form
  private handler?: Handler


  constructor(form: Form) {
    this.form = form
  }


  setHandler(handler: Handler) {
    this.handler = handler
  }

  /**
   * Check for ability to form submit.
   * @return {string|void} - returns undefined if it's OK else returns a reason.
   */
  canSubmit(): string | void {
    // disallow submit invalid form
    if (!this.form.valid) return `The form is invalid.`
    // do nothing if form is submitting at the moment
    if (this.form.submitting) return `The form is submitting now.`

    if (!this.form.config.allowSubmitUnchangedForm) {
      if (!this.form.dirty) return `The form hasn't changed.`
    }
  }

  async startSubmit(): Promise<void> {
    if (!this.handler) return

    const { values, editedValues } = this.form

    this.form.$setState({ submitting: true })
    this.form.$riseActionEvent(FormEvent.submitStart)

    // run submit callback
    await this.runSubmitHandler(this.handler, values, editedValues)
  }


  private async runSubmitHandler(
    handler: (values: Values, editedValues: Values) => Promise<void> | void,
    values: Values,
    editedValues: Values
  ): Promise<void> {
    // get result of submit handler
    const returnedPromiseOrVoid = handler(values, editedValues)

    try {
      // wait for saving process
      await resolvePromise(returnedPromiseOrVoid)
    }
    catch (error) {
      this.form.$setState({ submitting: false })
      this.form.$riseActionEvent(FormEvent.submitEnd, error as Error)

      return
    }

    this.afterSubmitSuccess(values)
  }


  private afterSubmitSuccess(values: Values): void {
    this.form.$setState({ submitting: false })
    this.form.$moveValuesToSaveLayer(values)
    this.form.$riseActionEvent(FormEvent.submitEnd)
  }

}
