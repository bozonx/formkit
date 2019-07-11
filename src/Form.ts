const isPlainObject = require('lodash/isPlainObject');
const get = require('lodash/get');
const set = require('lodash/set');

import Storage, {Store} from './Storage';
import FormStorage, { FormEventName, Values } from './FormStorage';
import FieldStorage from './FieldStorage';
import Field from './Field';
import DebouncedCall from './helpers/DebouncedCall';
import {
  findFieldRecursively,
  eachFieldRecursively,
  eachRecursively,
  eachFieldSchemaRecursively,
  resolvePromise
} from './helpers/helpers';
import Config from './interfaces/Config';
import FieldSchema from './interfaces/FieldSchema';
import FormStorageEventData from './interfaces/eventData/FormStorageEventData';
import FormState from './interfaces/FormState';
import ChangeEventData from './interfaces/eventData/ChangeEventData';
import ActionEventData from './interfaces/eventData/ActionEventData';
import SubmitControl from './SubmitControl';
import SaveControl from './SaveControl';
import ValidateControl, {Handler as ValidateCb} from './ValidateControl';


export interface ErrorMessage {
  field: string;
  message: string;
}


export default class Form {
  // it's nested object
  readonly fields: {[index: string]: Field} = {};
  readonly config: Config;
  readonly fieldStorage: FieldStorage;

  private readonly storage: Storage = new Storage();
  private readonly formStorage: FormStorage;
  private readonly saveControl: SaveControl;
  private readonly submitControl: SubmitControl;
  private readonly validateControl: ValidateControl;

  constructor(config: Config) {
    this.config = config;
    this.formStorage = new FormStorage(this.storage);
    this.fieldStorage = new FieldStorage(this.storage, this.formStorage);
    this.saveControl = new SaveControl(this);
    this.submitControl = new SubmitControl(this);
    this.validateControl = new ValidateControl(this);
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
    const field: Field | void = findFieldRecursively(this.fields, (field: Field) => {
      return field.dirty;
    });

    return Boolean(field && field.dirty);
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
    validateCb?: ValidateCb
  ): void {
    validateCb && this.validateControl.setHandler(validateCb);

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
    this.formStorage.emitStorageEvent(this.values, undefined);
  }

  /**
   * Add one or more handlers on form's event:
   */
  on(eventName: FormEventName, cb: (data: FormStorageEventData | ChangeEventData | ActionEventData) => void): number {
    return this.formStorage.on(eventName, cb);
  }

  removeListener(eventName: FormEventName, handlerIndex: number): void {
    this.formStorage.removeListener(eventName, handlerIndex);
  }

  onSubmit(handler: (values: Values, editedValues: Values) => Promise<void> | void): void {
    this.submitControl.setHandler(handler);
  }

  onSave(handler: (values: Values) => Promise<void> | void): void {
    this.saveControl.setHandler(handler);
  }

  /**
   * Start saving of form immediately.
   */
  save(): Promise<void> {
    return this.saveControl.startSaving(true);
  }

  /**
   * Check for ability to form submit.
   * @return {string|void} - returns undefined if it's OK else returns a reason.
   */
  canSubmit(): string | void {
    return this.submitControl.canSubmit();
  }

  /**
   * Check for field can be saved.
   * @return {string|void} - undefined means it can. Otherwise it returns a reason.
   */
  canSave(): string | void {
    return this.saveControl.canSave();
  }

  /**
   * It can be placed as a handler of <form> element on onSubmit attribute.
   * Please check ability of submission of form by calling `form.canSubmit()` or use submittable param
   * @return {Promise|undefined} - wait for submit has finished
   */
  handleSubmit = (): Promise<void> => {
    return this.submitControl.startSubmit();
  }

  /**
   * Roll back to initial values for all the fields.
   */
  clear = (): void => {
    this.updateStateAndValidate((): void => {
      eachFieldRecursively(this.fields, (field: Field) => field.$clearSilent());
    });
  }

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert = (): void => {
    this.updateStateAndValidate((): void => {
      eachFieldRecursively(this.fields, (field: Field) => field.$revertSilent());
    });
  }

  /**
   * Reset values to default values for all the fields.
   */
  reset = (): void => {
    this.updateStateAndValidate((): void => {
      eachFieldRecursively(this.fields, (field: Field) => field.$resetSilent());
    });
  }

  /**
   * Clear storage and remove all the event handlers
   */
  destroy(): Promise<void> {
    // TODO: как удалить чтобы сборщик мусора сработал?
    //this.handlers = {};

    this.flushSaving();

    const doDestroy = (): void => {
      eachFieldRecursively(this.fields, (field: Field): void => {
        field.$destroyHandlers();
      });

      this.formStorage.destroy();
    };

    // wait for save and submit process have finished
    return Promise.all([
      this.saveControl.getSavePromise(),
      //resolvePromise(this.submitPromise),
    ])
      .then(doDestroy)
      .catch(doDestroy);
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving(): void {
    this.saveControl.cancel();
  }

  /**
   * SaveControl immediately
   */
  flushSaving(): void {
    this.saveControl.flush();
  }

  /**
   * Set callback wich will be called on each validating request.
   */
  setValidateCb(validateCb: ValidateCb): void {
    this.validateControl.setHandler(validateCb);

    this.updateStateAndValidate();
  }

  /**
   * Set form's values silently without rising a "change" event
   * @param {object} newValues - fields' values.
   *                             You can set values all the fields or just to a part of fields.
   */
  setValues(newValues: Values) {
    if (!isPlainObject(newValues)) {
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
    if (!isPlainObject(newValues)) {
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
    return this.validateControl.validate();
  }

  $getWholeStorageState(): Store {
    return this.storage.getWholeStorageState();
  }

  $setStateSilent(partlyState: FormState): void {
    this.formStorage.setStateSilent(partlyState);
  }

  $handleFieldChange(eventData: ChangeEventData): void {
    // run form's change event
    this.$emit('change', eventData);
    this.saveControl.startSaving(false);
  }

  $emit(eventName: FormEventName, data: FormStorageEventData | ChangeEventData | ActionEventData) {
    this.formStorage.emit(eventName, data);
  }

  $moveValuesToSaveLayer(values: Values, force?: boolean): void {
    this.updateStateAndValidate(() => {
      eachFieldRecursively(this.fields, (field: Field, pathToField: string) => {
        const savedValue = get(values, pathToField);

        field.$setValueAfterSave(savedValue);
      });
    }, force);
  }

  $setState(partlyState: {[index: string]: any}): void {
    this.updateState(() => {
      this.formStorage.setStateSilent(partlyState);
    });
  }

  $riseActionEvent(eventName: FormEventName, error?: Error): void {
    const eventData: ActionEventData = {
      error
    };

    this.$emit(eventName, eventData);
  }


  /**
   * Initialize a field.
   * @param {string} pathToField
   * @param {object} fieldParams - { initial, defaultValue, disabled, validate, debounceTime }
   * @private
   */
  private initField(pathToField: string, fieldParams: FieldSchema): void {
    // Try to get existent field
    const existentField = get(this.fields, pathToField);

    if (existentField) {
      throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`);
    }

    // create new one
    const newField: Field = new Field(pathToField, fieldParams, this);

    set(this.fields, pathToField, newField);
  }

  private updateStateAndValidate(cbWhichChangesState?: () => void, force?: boolean): void {
    this.updateState(() => {
      if (cbWhichChangesState) cbWhichChangesState();
      this.validate();
    }, force);
  }

  private updateState(cbWhichChangesState: () => void, force?: boolean): void {
    const prevState: FormState = this.formStorage.getWholeState();

    if (cbWhichChangesState) cbWhichChangesState();

    const newState = this.formStorage.getWholeState();
    this.formStorage.emitStorageEvent(newState, prevState, force);
  }

  private eachRawField(
    values: {[index: string]: any},
    cb: (field: Field, value: any, path: string) => void
  ): void {
    eachRecursively(values, (value: any, path: string) => {
      const field = get(this.fields, path);

      // if it is'n a field - go deeper
      if (!field || !(field instanceof Field)) {
        if (isPlainObject(value)) {
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
