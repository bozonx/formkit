const get = require('lodash/get');
const set = require('lodash/set');

import {Form} from './Form.js'
import type {Values} from './FormStorage.js'
import {Field} from './Field.js'
import {eachFieldRecursively} from './helpers/helpers.js'
import type {FieldState} from './types/FieldState.js'


export type Handler = (errors: {[index: string]: string}, values: {[index: string]: any}) => void;


export class ValidateControl {
  private readonly form: Form;
  private handler?: Handler;


  constructor(form: Form) {
    this.form = form;
  }

  setHandler(handler: Handler) {
    this.handler = handler;
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate(): string | void {

    // TODO: refactor

    if (!this.handler) return;

    const errors: {[index: string]: string} = {};
    const values: Values = this.form.values;
    let isFormValid: boolean = true;

    // add sub structures to "errors" for easy access to error
    eachFieldRecursively(this.form.fields, (field: Field, path: string) => {
      const split: Array<string> = path.split('.');
      const minPathItems: number = 2;

      if (split.length < minPathItems) return;

      split.pop();

      const basePath: string = split.join();

      set(errors, basePath, {});
    });

    // do validate
    this.handler(errors, values);

    // TODO: review - make eachFieldRecursively function
    // set valid state to all the fields
    eachFieldRecursively(this.form.fields, (field: Field, path: string) => {
      const invalidMsg = get(errors, path);

      if (isFormValid) isFormValid = !invalidMsg;

      const fieldPartlyState: FieldState = {
        invalidMsg
      };

      field.$setStateSilent(fieldPartlyState);
    });

    this.form.$setStateSilent({ valid: isFormValid });
  }

}
