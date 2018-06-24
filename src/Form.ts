import * as _ from 'lodash';
import Storage from './Storage';
import FormStorage, { FromEventName } from './FormStorage';
import FieldStorage from './FieldStorage';
import Field from './Field';
import DebouncedCall from './helpers/DebouncedCall';
import {
  findFieldRecursively,
  findRecursively,
  eachFieldSchemaRecursively,
  isPromise
} from './helpers/helpers';
import Config from './interfaces/Config';
import FieldSchema from './interfaces/FieldSchema';
import EventData from './interfaces/EventData';


export interface ErrorMessage {
  field: string;
  message: string;
}

interface Hnadlers {
  onSubmit?: () => void;
  onSave?: () => void;
}

// TODO: может быть вложенный
type Values = { [index: string]: any };
type ValidateCb = (errors: {[index: string]: string}, values: {[index: string]: any}) => void;


/**
 * Form
 */
export default class Form {
  // TODO: может быть вложенный
  readonly fields: {[index: string]: Field} = {};
  readonly config: Config;

  private readonly debouncedSave: DebouncedCall;
  private readonly storage: Storage = new Storage();
  private readonly formStorage: FormStorage;
  private readonly fieldStorage: FieldStorage;
  // TODO: review
  private readonly submitPromise?: Function;
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
      initialFields.forEach((pathToField) => this._initField(pathToField, {}));
    }
    else {
      // read schema
      eachFieldSchemaRecursively(initialFields, (fieldSchema: FieldSchema, path: string) => {
        this._initField(path, fieldSchema);
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
  on(eventName: FromEventName, cb: (data: EventData) => void): void {
    this.formStorage.on(eventName, cb);
  }

  off(eventName: FromEventName, cb: (data: EventData) => void): void {
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
    return this._startSaving(true);
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
  handleSubmit = (): Promise<void> => {
    if (!this.handlers.onSubmit) return;

    const { values, editedValues } = this;

    this._setState({ submitting: true });
    this.$emit('submitStart', { values, editedValues });

    // run submit callback
    this.submitPromise = this._runSubmitHandler(values, editedValues);
    this.submitPromise
      .then((data) => {
        this.submitPromise = null;

        return data;
      })
      .catch((err) => {
        this.submitPromise = null;

        return Promise.reject(err);
      });

    return this.submitPromise;
  };

  /**
   * Roll back to initial values for all the fields.
   */
  clear = () => {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field) => field.$clearSilent());
    });
  };

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert = () => {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field) => field.$revertSilent());
    });
  };

  /**
   * Reset values to default values for all the fields.
   */
  reset = () => {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field) => field.$resetSilent());
    });
  };

  /**
   * Clear storage and remove all the event handlers
   */
  destroy() {
    this.handlers = {};

    this.flushSaving();

    const doDestroy = () => {
      findFieldRecursively(this.fields, (field) => {
        return field.$destroyHandlers();
      });

      this.formStorage.destroy();
    };

    // wait for save and submit process have finished
    Promise.all([
      this.debouncedSave.getPromise() || Promise.resolve(),
      this.submitPromise || Promise.resolve(),
    ])
      .then(doDestroy)
      .catch(doDestroy);
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving() {
    this.debouncedSave.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this.debouncedSave.flush();
  }

  /**
   * Set callback wich will be called on each validating request.
   * @param {function} cb - callback like (errors, values) => {...}
   */
  setValidateCb(cb) {
    this.validateCb = cb;

    this._updateStateAndValidate();
  }

  /**
   * Set form's values silently without rising a "change" event
   * @param {object} newValues - fields' values.
   *                             You can set values all the fields or just to a part of fields.
   */
  setValues(newValues) {
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    this._updateStateAndValidate(() => {
      findRecursively(newValues, (value, path) => {
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
        // set value to edited layer
        field.$setEditedValueSilent(value);

        return false;
      });
    });
  }

  /**
   * Set values to "saved" level and clear current values.
   * It usually runs after saving has successfully done.
   * It needs if you want to rollback user changes to previously saved values.
   * @param newValues
   */
  setSavedValues(newValues) {
    if (!_.isPlainObject(newValues)) throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`);

    this._updateStateAndValidate(() => {
      findRecursively(newValues, (value, path) => {
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
        field.$setSavedValue(value);

        return false;
      });
    });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate() {
    if (!this.validateCb) return;

    const errors = {};
    const values = this.values;
    let isFormValid = true;

    // add sub structures to "errors" for easy access to error
    findFieldRecursively(this.fields, (field, path) => {
      const split = path.split('.');
      const minPathItems = 2;
      if (split.length < minPathItems) return;

      split.pop();
      const basePath = split.join();

      _.set(errors, basePath, {});
    });

    // do validate
    this.validateCb(errors, values);

    // set valid state to all the fields
    findFieldRecursively(this.fields, (field, path) => {
      const invalidMsg = _.get(errors, path) || null;
      if (isFormValid) isFormValid = !invalidMsg;

      field.$setStateSilent({ invalidMsg });
    });

    this.formStorage.setStateSilent({ valid: isFormValid });
  }

  $getWholeStorageState() {
    return this.storage.getWholeStorageState();
  }

  $setStateSilent(partlyState) {
    this.formStorage.setStateSilent(partlyState);
  }

  $handleFieldChange(eventData) {
    // run form's change event
    this.$emit('change', eventData);

    const isImmediately = false;
    this._startSaving(isImmediately);
  }

  $emit(eventName, data) {
    this.formStorage.emit(eventName, data);
  }

  _startSaving(isImmediately) {
    // don't run saving process if there isn't onSave callback
    if (!this.handlers.onSave) return;

    const valuesBeforeSave = this.values;

    this.debouncedSave.exec(this.doSave, isImmediately);
    this.debouncedSave.onEnd((error) => {
      if (error) {
        this._setState({ saving: false });
        this.$emit('saveEnd', { error });
      }
      else {
        const force = true;
        this.$setStateSilent({ saving: false });
        this._moveValuesToSaveLayer(valuesBeforeSave, force);
        this.$emit('saveEnd');
      }
    });

    return this.debouncedSave.getPromise();
  }

  private doSave = () => {
    this._setState({ saving: true });
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

  _runSubmitHandler(values, editedValues) {
    // get result of submit handler
    const returnedValue = this.handlers.onSubmit({ values, editedValues });

    // if handler returns a promise - wait for its fulfilling
    if (isPromise(returnedValue)) {
      return returnedValue
        .then((data) => {
          this._afterSubmitSuccess(values);

          return data;
        })
        .catch((error) => {
          this._setState({ submitting: false });
          this.$emit('submitEnd', { error });

          return Promise.reject(error);
        });
    }

    // else if handler returns any other type - don't wait and finish submit process
    this._afterSubmitSuccess(values);

    return Promise.resolve();
  }

  _afterSubmitSuccess(values) {
    this._setState({ submitting: false });
    this._moveValuesToSaveLayer(values);
    this.$emit('submitEnd');
  }

  _moveValuesToSaveLayer(values, force) {
    this._updateStateAndValidate(() => {
      findFieldRecursively(this.fields, (field, pathToField) => {
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
  _initField(pathToField: string, fieldParams: FieldSchema) {
    // Try to get existent field
    const existentField = _.get(this.fields, pathToField);

    if (existentField) {
      throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`);
    }

    // create new one
    const newField: Field = new Field(pathToField, fieldParams, this, this.fieldStorage);

    _.set(this.fields, pathToField, newField);
  }

  _setState(partlyState) {
    this._updateState(() => {
      this.formStorage.setStateSilent(partlyState);
    });
  }

  _updateStateAndValidate(cbWhichChangesState, force) {
    this._updateState(() => {
      if (cbWhichChangesState) cbWhichChangesState();
      this.validate();
    }, force);
  }

  _updateState(cbWhichChangesState, force) {
    const oldState = this.formStorage.getWholeState();

    if (cbWhichChangesState) cbWhichChangesState();

    const newState = this.formStorage.getWholeState();
    this.formStorage.emitStorageEvent('update', newState, oldState, force);
  }

}
