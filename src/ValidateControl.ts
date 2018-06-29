import Form from './Form';
import {Values} from './FormStorage';
import * as _ from 'lodash';
import Field from './Field';
import {eachFieldRecursively} from './helpers/helpers';
import FieldState from './interfaces/FieldState';


export type Handler = (errors: {[index: string]: string}, values: {[index: string]: any}) => void;


export default class ValidateControl {
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

      _.set(errors, basePath, {});
    });

    // do validate
    this.handler(errors, values);

    // TODO: review - make eachFieldRecursively function
    // set valid state to all the fields
    eachFieldRecursively(this.form.fields, (field: Field, path: string) => {
      const invalidMsg = _.get(errors, path);

      if (isFormValid) isFormValid = !invalidMsg;

      const fieldPartlyState: FieldState = {
        invalidMsg
      };

      field.$setStateSilent(fieldPartlyState);
    });

    this.form.$setStateSilent({ valid: isFormValid });
  }

}
