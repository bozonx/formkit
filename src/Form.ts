import {deepGet, deepSet, isPlainObject} from 'squidlet-lib'
import type {Store} from './Storage.js'
import {Storage} from './Storage.js'
import {FormStorage} from './FormStorage.js'
import {FieldStorage} from './FieldStorage.js'
import {Field} from './Field.js'
import {
  eachFieldRecursively,
  eachFieldSchemaRecursively,
  eachRecursively,
  findFieldRecursively,
} from './helpers/helpers.js'
import type {Config} from './types/Config.js'
import type {FieldSchema} from './types/FieldSchema.js'
import type {FormStorageEventData} from './types/eventData/FormStorageEventData.js'
import type {ChangeEventData} from './types/eventData/ChangeEventData.js'
import type {ActionEventData} from './types/eventData/ActionEventData.js'
import {SubmitControl} from './SubmitControl.js'
import {SaveControl} from './SaveControl.js'
import type {Handler as ValidateCb} from './ValidateControl.js'
import {ValidateControl} from './ValidateControl.js'
import type {ErrorMessage} from './types/ErrorMessage.js'
import {FormEvent} from './types/FormTypes.js'
import type {FormState} from './types/FormTypes.js'
import type {Values} from './types/types.js'


export class Form {
  // it's nested object
  readonly fields: Record<string, Field> = {}
  readonly config: Config
  readonly fieldStorage: FieldStorage

  private readonly storage: Storage = new Storage()
  private readonly formStorage: FormStorage
  private readonly saveControl: SaveControl
  private readonly submitControl: SubmitControl
  private readonly validateControl: ValidateControl

  get values(): Values {
    return this.formStorage.getCombinedValues()
  }

  get savedValues(): Values {
    return this.formStorage.getSavedValues()
  }

  get editedValues(): Values {
    return this.formStorage.getEditedValues()
  }

  get unsavedValues(): Values {
    return this.formStorage.getUnSavedValues()
  }

  get dirty(): boolean {
    // search for dirty values in fields
    const field: Field | void = findFieldRecursively(this.fields, (field: Field) => {
      return field.dirty
    })

    return Boolean(field && field.dirty)
  }

  get touched(): boolean {
    return this.formStorage.getState('touched')
  }

  /**
   * Returns true if one or more fields are saving.
   */
  get saving(): boolean {
    return this.formStorage.getState('saving')
  }

  get submitting(): boolean {
    return this.formStorage.getState('submitting')
  }

  /**
   * allow/disallow submit. It helpful to use as "disabled" button's attribute.
   * @return {boolean} - true if allows to submit.
   */
  get submittable(): boolean {
    //return !this.canSubmit()
    return !this.submitControl.canSubmit()
  }

  get savable(): boolean {
    //return !this.canSave()
    return !this.saveControl.canSave()
  }

  // /**
  //  * Check for ability to form submit.
  //  * @return {string|void} - returns undefined if it's OK else returns a reason.
  //  */
  // get canSubmit(): string | void {
  //   return this.submitControl.canSubmit()
  // }
  //
  // /**
  //  * Check for field can be saved.
  //  * @return {string|void} - undefined means it can. Otherwise it returns a reason.
  //  */
  // get canSave(): string | void {
  //   return this.saveControl.canSave()
  // }

  get valid(): boolean {
    return this.formStorage.getState('valid')
  }

  /**
   * Get all the messages of invalid fields
   * @return {Array} - like [{path: "path.to.field", message: "msg"}, ...]
   */
  get invalidMessages(): Array<ErrorMessage> {
    return this.formStorage.getInvalidMessages()
  }


  constructor(config: Config) {
    this.config = config
    this.formStorage = new FormStorage(this.storage)
    this.fieldStorage = new FieldStorage(this.storage, this.formStorage)
    this.saveControl = new SaveControl(this)
    this.submitControl = new SubmitControl(this)
    this.validateControl = new ValidateControl(this)
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
    validateCb && this.validateControl.setHandler(validateCb)

    if (Array.isArray(initialFields)) {
      initialFields
        .forEach((pathToField) => this.initField(pathToField, {}))
    }
    else {
      // read schema
      eachFieldSchemaRecursively<FieldSchema>(initialFields, (fieldSchema: FieldSchema, path: string) => {
        this.initField(path, fieldSchema)
      })
    }

    // validate whole form
    this.validate()
    // emit init event
    this.formStorage.emitStorageEvent(this.values, undefined)
  }


  getField(fieldName: string): Field | undefined {
    return deepGet(this.fields, fieldName)
  }

  getOrRegisterField(fieldName: string, schema?: Partial<FieldSchema>): Field {
    const existentField = deepGet(this.fields, fieldName)

    if (existentField) return existentField

    const field = this.initField(fieldName, schema || {})

    // TODO: нужно ли валидировать?
    // TODO: нужно ли поднимать событие???


    return field
  }

  on(event: FormEvent, cb: (data: FormStorageEventData | ChangeEventData | ActionEventData) => void): number {
    return this.formStorage.on(event, cb);
  }

  removeListener(event: FormEvent, handlerIndex: number): void {
    this.formStorage.removeListener(event, handlerIndex)
  }

  onSubmit(handler: (values: Values, editedValues: Values) => Promise<void> | void): void {
    this.submitControl.setHandler(handler)
  }

  onSave(handler: (values: Values) => Promise<void> | void): void {
    this.saveControl.setHandler(handler)
  }

  /**
   * Start saving of form immediately.
   */
  save(): Promise<void> {
    return this.saveControl.startSaving(true)
  }

  /**
   * It can be placed as a handler of <form> element on onSubmit attribute.
   * Please check ability of submission of form by calling `form.canSubmit()` or use submittable param
   * @return {Promise|undefined} - wait for submit has finished
   */
  handleSubmit = (): Promise<void> => {
    return this.submitControl.startSubmit()
  }

  /**
   * Roll back to initial values for all the fields.
   */
  clear = (): void => {
    this.updateStateAndValidate((): void => {
      eachFieldRecursively(this.fields, (field: Field) => field.$clearSilent())
    });
  }

  /**
   * Roll back to previously saved values for all the fields.
   */
  revert = (): void => {
    this.updateStateAndValidate((): void => {
      eachFieldRecursively(this.fields, (field: Field) => field.$revertSilent())
    })
  }

  /**
   * Reset values to default values for all the fields.
   */
  reset = (): void => {
    this.updateStateAndValidate((): void => {
      eachFieldRecursively(this.fields, (field: Field) => field.$resetSilent())
    });
  }

  /**
   * Clear storage and remove all the event handlers
   */
  destroy(): Promise<void> {
    // TODO: как удалить чтобы сборщик мусора сработал?
    //this.handlers = {};

    this.flushSaving()

    const doDestroy = (): void => {
      eachFieldRecursively(this.fields, (field: Field): void => {
        field.$destroyHandlers()
      });

      this.formStorage.destroy()
    };

    // wait for save and submit process have finished
    return Promise.all([
      this.saveControl.getSavePromise(),
      //resolvePromise(this.submitPromise),
    ])
      .then(doDestroy)
      .catch(doDestroy)
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving(): void {
    this.saveControl.cancel()
  }

  /**
   * SaveControl immediately
   */
  flushSaving(): void {
    this.saveControl.flush()
  }

  /**
   * Set callback wich will be called on each validating request.
   */
  setValidateCb(validateCb: ValidateCb): void {
    this.validateControl.setHandler(validateCb)

    this.updateStateAndValidate()
  }

  /**
   * Set form's values silently without rising a "change" event
   * @param {object} newValues - fields' values.
   *                             You can set values all the fields or just to a part of fields.
   */
  setValues(newValues: Values) {
    if (!isPlainObject(newValues)) {
      throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`)
    }

    this.updateStateAndValidate(() => {
      this.eachRawField(newValues, (field: Field, value: any): void => {
        field.$setEditedValueSilent(value)
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
      throw new Error(`form.setValues(). Incorrect types of values ${JSON.stringify(newValues)}`)
    }

    this.updateStateAndValidate(() => {
      this.eachRawField(newValues, (field: Field, value: any): void => {
        field.$setSavedValue(value)
      });
    });
  }

  /**
   * Validate whole form.
   * @return {string|undefined} - valid if undefined or error message.
   */
  validate(): string | void {
    return this.validateControl.validate()
  }

  $getWholeStorageState(): Store {
    return this.storage.getWholeStorageState()
  }

  $setStateSilent(partlyState: Partial<FormState>): void {
    this.formStorage.setStateSilent(partlyState)
  }

  $handleFieldChange(eventData: ChangeEventData): void {
    // run form's change event
    this.$emit(FormEvent.change, eventData)

    // TODO: does it need to ignore promise ???
    this.saveControl.startSaving(false)
  }

  $emit(event: FormEvent, data: FormStorageEventData | ChangeEventData | ActionEventData) {
    this.formStorage.emit(event, data)
  }

  $moveValuesToSaveLayer(values: Values, force?: boolean): void {
    this.updateStateAndValidate(() => {
      eachFieldRecursively(this.fields, (field: Field, pathToField: string) => {
        const savedValue = deepGet(values, pathToField)

        field.$setValueAfterSave(savedValue)
      });
    }, force);
  }

  $setState(partlyState: {[index: string]: any}): void {
    this.updateState(() => {
      this.formStorage.setStateSilent(partlyState)
    });
  }

  $riseActionEvent(event: FormEvent, error?: Error): void {
    const eventData: ActionEventData = {
      error
    }

    this.$emit(event, eventData)
  }


  /**
   * Initialize a field.
   * @param {string} pathToField
   * @param {object} fieldParams - { initial, defaultValue, disabled, validate, debounceTime }
   * @private
   */
  private initField(pathToField: string, fieldParams: Partial<FieldSchema> = {}): Field {
    // Try to get existent field
    const existentField = deepGet(this.fields, pathToField)

    if (existentField) {
      throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`)
    }

    // create new one
    const newField: Field = new Field(pathToField, fieldParams, this)

    deepSet(this.fields, pathToField, newField)

    return newField
  }

  private updateStateAndValidate(cbWhichChangesState?: () => void, force?: boolean): void {
    this.updateState(() => {
      if (cbWhichChangesState) cbWhichChangesState()
      this.validate()
    }, force)
  }

  private updateState(cbWhichChangesState: () => void, force?: boolean): void {
    const prevState: Partial<FormState> = this.formStorage.getWholeState()

    if (cbWhichChangesState) cbWhichChangesState()

    const newState = this.formStorage.getWholeState()
    this.formStorage.emitStorageEvent(newState, prevState, force)
  }

  private eachRawField(
    values: {[index: string]: any},
    cb: (field: Field, value: any, path: string) => void
  ): void {
    eachRecursively(values, (value: any, path: string) => {
      const field = deepGet(this.fields, path)

      // if it is'n a field - go deeper
      if (!field || !(field instanceof Field)) {
        if (isPlainObject(value)) {
          // go deeper
          return
        }

        // stop
        return false
      }
      // else means it's field - set value and don't go deeper
      // set value to saved layer
      cb(field, value, path)

      return false
    });
  }

}
