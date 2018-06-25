import * as _ from 'lodash';
import Storage, {Store} from './Storage';
import FormStorage, { FormEventName, Values } from './FormStorage';
import FieldStorage from './FieldStorage';
import Field from './Field';
import DebouncedCall from './helpers/DebouncedCall';
import {
  findFieldRecursively,
  findRecursively,
  eachFieldSchemaRecursively,
  isPromise, resolvePromise
} from './helpers/helpers';
import Config from './interfaces/Config';
import FieldSchema from './interfaces/FieldSchema';
import FormEventData from './interfaces/FormEventData';
import FormState from './interfaces/FormState';


type ValidateCb = (errors: {[index: string]: string}, values: {[index: string]: any}) => void;

export interface ErrorMessage {
  field: string;
  message: string;
}

interface Hnadlers {
  onSubmit?: (values: Values, editedValues: Values) => void;
  onSave?: () => void;
}



/**
 * Form
 */
export default class Form {
  // TODO: может быть вложенный
  readonly fields: {[index: string]: Field} = {};
  readonly config: Config;
  readonly fieldStorage: FieldStorage;

  private readonly debouncedSave: DebouncedCall;
  private readonly storage: Storage = new Storage();
  private readonly formStorage: FormStorage;
  // TODO: review
  private submitPromise?: Function;
  // TODO: review
  private readonly handlers: Hnadlers = {
    onSubmit: undefined,
    onSave: undefined,
  };
  // TODO: review почему не в handlers ???
  private validateCb?: ValidateCb;

  constructor(config: Config) {
    this.config = config;
    this.debouncedSave = new DebouncedCall(this.config.debounceTime);
    this.formStorage = new FormStorage(this.storage);
    this.fieldStorage = new FieldStorage(this.storage);
  }

  get values(): Values {
    return this.formStorage.getCombinedValues();
  }

  get savedValues(): Values {
    return this.formStorage.getSavedValues();
  }

  get editedValues(): Values {
    return this.formStorage.getEditedValues();
  }

  get unsavedValues(): Values {
    return this.formStorage.getUnSavedValues();
  }

  get dirty(): boolean {
    // search for dirty values in fields
    return Boolean(findFieldRecursively(this.fields, (field: Field) => {
      return field.dirty;
    }));
  }

  get touched(): boolean {
    return this.formStorage.getState('touched');
  }

  /**
   * Returns true if one or more fields are saving.
   */
  get saving(): boolean {
    return this.formStorage.getState('saving');
  }

  get submitting(): boolean {
    return this.formStorage.getState('submitting');
  }

  /**
   * allow/disallow submit. It helpful to use as "disabled" button's attribute.
   * @return {boolean} - true if allows to submit.
   */
  get submittable(): boolean {
    return !this.canSubmit();
  }

  get savable(): boolean {
    return !this.canSave();
  }

  get valid(): boolean {
    return this.formStorage.getState('valid');
  }

  /**
   * Get all the messages of invalid fields
   * @return {Array} - like [{path: "path.to.field", message: "msg"}, ...]
   */
  get invalidMessages(): Array<ErrorMessage> {
    return this.formStorage.getInvalidMessages();
  }

  /**
   * It calls from outer app's code to init form.
   * @param {array|object} initialFields
   *   * if array: you can pass just fields name like: ['id', 'title', 'body']
   *   * if object: you can pass a fields config like: {name: {default: 'no name', ...}}
   * @param {function} validateCb - function which will be called on each change to validate form
   */
  init(
    initialFields: Array<string> | {[index: string]: object},
    validateCb: ValidateCb
  ): void {
    this.validateCb = validateCb;

    if (Array.isArray(initialFields)) {
      initialFields.forEach((pathToField) => this.initField(pathToField, {}));
    }
    else {
      // read schema
      eachFieldSchemaRecursively(initialFields, (fieldSchema: FieldSchema, path: string) => {
        this.initField(path, fieldSchema);
      });
    }

    // validate whole form
    this.validate();
    // emit init event
    this.formStorage.emitStorageEvent('init', this.values, undefined);
  }

  /**
   * Add one or more handlers on form's event:
   */
  on(eventName: FormEventName, cb: (data: FormEventData) => void): void {
    this.formStorage.on(eventName, cb);
  }

  off(eventName: FormEventName, cb: (data: FormEventData) => void): void {
    this.formStorage.off(eventName, cb);
  }

  onSubmit(handler: () => void): void {
    this.handlers.onSubmit = handler;
  }

  onSave(handler: () => void): void {
    this.handlers.onSave = handler;
  }

  /**
   * Start saving of form immediately.
   */
  save(): Promise<void> {
    return this.startSaving(true);
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

  /**
   * Check for field can be saved.
   * @return {string|void} - undefined means it can. Otherwise it returns a reason.
   */
  canSave(): string | void {
    // disallow save invalid form
    if (!this.valid) return `The form is invalid.`;
    if (!this.touched) return `The form hasn't been modified`;
  }

  /**
   * It can be placed as a handler of <form> element on onSubmit attribute.
   * Please check ability of submission of form by calling `form.canSubmit()` or use submittable param
   * @return {Promise|undefined} - wait for submit has finished
   */
  handleSubmit = async (): Promise<void> => {
    if (!this.handlers.onSubmit) return;

    const { values, editedValues } = this;

    this.setState({ submitting: true });
    this.$emit('submitStart', { values, editedValues });

    // run submit callback
    await this.runSubmitHandler(values, editedValues);

    // TODO: зачем это нужно ???
    //this.submitPromise = null;
  };

  /**
   * Roll back to initial values for all the fields.
   */
  clear = (): void => {
    this.updateStateAndValidate((): void => {
      findFieldRecursively(this.fields, (field: Field) => field.$clearSilent());
    });
  };

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert = (): void => {
    this.updateStateAndValidate((): void => {
      findFieldRecursively(this.fields, (field: Field) => field.$revertSilent());
    });
  };

  /**
   * Reset values to default values for all the fields.
   */
  reset = (): void => {
    this.updateStateAndValidate((): void => {
      findFieldRecursively(this.fields, (field: Field) => field.$resetSilent());
    });
  };

  /**
   * Clear storage and remove all the event handlers
   */
  destroy(): Promise<void> {
    // TODO: как удалить чтобы сборщик мусора сработал?
    this.handlers = {};

    this.flushSaving();

    const doDestroy = (): void => {
      findFieldRecursively(this.fields, (field: Field): void => {
        field.$destroyHandlers();
      });

      this.formStorage.destroy();
    };

    // wait for save and submit process have finished
    return Promise.all([
      this.debouncedSave.getPromise() || Promise.resolve(),
      this.submitPromise || Promise.resolve(),
    ])
      .then(doDestroy)
      .catch(doDestroy);
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving(): void {
    this.debouncedSave.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving(): void {
    this.debouncedSave.flush();
  }

  /**
   * Set callback wich will be called on each validating request.
   * @param {function} cb - callback like (errors, values) => {...}
   */
  setValidateCb(cb: ValidateCb): void {
    this.validateCb = cb;

    this.updateStateAndValidate();
  }

  /**
   * Set form's values silently without rising a "change" event
   * @param {object} newValues - fields' values.
   *                             You can set values all the fields or just to a part of fields.
   */
  setValues(newValues: Values) {
    if (!_.isPlainObject(newValues)) {
      throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);
    }

    this.updateStateAndValidate(() => {
      this.eachRawField(newValues, (field: Field, value: any): void => {
        field.$setEditedValueSilent(value);
      });
    });
  }

  /**
   * Set values to "saved" level and clear current values.
   * It usually runs after saving has successfully done.
   * It needs if you want to rollback user changes to previously saved values.
   * @param newValues
   */
  setSavedValues(newValues: Values) {
    if (!_.isPlainObject(newValues)) {
      throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);
    }

    this.updateStateAndValidate(() => {
      this.eachRawField(newValues, (field: Field, value: any): void => {
        field.$setSavedValue(value);
      });
    });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate(): string | void {
    if (!this.validateCb) return;

    const errors: {[index: string]: string} = {};
    const values: Values = this.values;
    let isFormValid: boolean = true;

    // add sub structures to "errors" for easy access to error
    findFieldRecursively(this.fields, (field: Field, path: string): void => {
      const split: Array<string> = path.split('.');
      const minPathItems: number = 2;

      if (split.length < minPathItems) return;

      split.pop();

      const basePath: string = split.join();

      _.set(errors, basePath, {});
    });

    // do validate
    this.validateCb(errors, values);

    // TODO: review - make eachFieldRecursively function
    // set valid state to all the fields
    findFieldRecursively(this.fields, (field: Field, path: string) => {
      const invalidMsg = _.get(errors, path) || null;

      if (isFormValid) isFormValid = !invalidMsg;

      field.$setStateSilent({ invalidMsg });
    });

    this.formStorage.setStateSilent({ valid: isFormValid });
  }

  $getWholeStorageState(): Store {
    return this.storage.getWholeStorageState();
  }

  $setStateSilent(partlyState: FormState): void {
    this.formStorage.setStateSilent(partlyState);
  }

  $handleFieldChange(eventData: FormEventData): void {
    // run form's change event
    this.$emit('change', eventData);
    this.startSaving(false);
  }

  $emit(eventName: FormEventName, data?: FormEventData) {
    this.formStorage.emit(eventName, data);
  }


  private startSaving(isImmediately: boolean): Promise<void> {

    // TODO: review

    // don't run saving process if there isn't onSave callback
    if (!this.handlers.onSave) return;

    const valuesBeforeSave = this.values;

    this.debouncedSave.exec(this.doSave, isImmediately);
    this.debouncedSave.onEnd((error: Error) => {
      if (error) {
        this.setState({ saving: false });
        this.$emit('saveEnd', { error });
      }
      else {
        const force = true;
        this.$setStateSilent({ saving: false });
        this.moveValuesToSaveLayer(valuesBeforeSave, force);
        this.$emit('saveEnd');
      }
    });

    return this.debouncedSave.getPromise();
  }

  private doSave = (): Promise<void> => {

    // TODO: review

    this.setState({ saving: true });
    // emit save start
    this.$emit('saveStart');

    // run save callback
    const cbResult = this.handlers.onSave(this.values);

    if (isPromise(cbResult)) {
      return cbResult;
    }

    // else if save callback hasn't returned a promise

    return Promise.resolve();
  };

  private async runSubmitHandler(values: Values, editedValues: Values): Promise<void> {

    // TODO: review

    // get result of submit handler
    const returnedValue = this.handlers.onSubmit && this.handlers.onSubmit(values, editedValues);
    const returnedPromise = resolvePromise(returnedValue);

    try {
      // wait for saving process
      await returnedPromise;
      this.afterSubmitSuccess(values);
    }
    catch (error: Error) {
      this.setState({ submitting: false });
      this.$emit('submitEnd', { error });
    }
  }

  private afterSubmitSuccess(values: Values): void {
    this.setState({ submitting: false });
    this.moveValuesToSaveLayer(values);
    this.$emit('submitEnd');
  }

  private moveValuesToSaveLayer(values: Values, force?: boolean): void {
    this.updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field: Field, pathToField: string) => {
        const savedValue = _.get(values, pathToField);

        field.$setValueAfterSave(savedValue);
      });
    }, force);
  }

  /**
   * Initialize a field.
   * @param {string} pathToField
   * @param {object} fieldParams - { initial, defaultValue, disabled, validate, debounceTime }
   * @private
   */
  private initField(pathToField: string, fieldParams: FieldSchema): void {
    // Try to get existent field
    const existentField = _.get(this.fields, pathToField);

    if (existentField) {
      throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`);
    }

    // create new one
    const newField: Field = new Field(pathToField, fieldParams, this);

    _.set(this.fields, pathToField, newField);
  }

  private setState(partlyState: {[index: string]: any}): void {
    this.updateState(() => {
      this.formStorage.setStateSilent(partlyState);
    });
  }

  private updateStateAndValidate(cbWhichChangesState?: () => void, force?: boolean): void {
    this.updateState(() => {
      if (cbWhichChangesState) cbWhichChangesState();
      this.validate();
    }, force);
  }

  private updateState(cbWhichChangesState: () => void, force?: boolean): void {
    const oldState: FormState = this.formStorage.getWholeState();

    if (cbWhichChangesState) cbWhichChangesState();

    const newState = this.formStorage.getWholeState();
    this.formStorage.emitStorageEvent('update', newState, oldState, force);
  }

  private eachRawField(
    values: {[index: string]: any},
    cb: (field: Field, value: any, path: string) => void
  ): void {
    findRecursively(values, (value: any, path: string) => {
      const field = _.get(this.fields, path);

      // if it is'n a field - go deeper
      if (!field || !(field instanceof Field)) {
        if (_.isPlainObject(value)) {
          // go deeper
          return;
        }

        // stop
        return false;
      }
      // else means it's field - set value and don't go deeper
      // set value to saved layer
      cb(field, value, path);

      return false;
    });
  }

}
