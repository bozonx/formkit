import { Map } from 'immutable';
import {deepSet, isEqual} from 'squidlet-lib'
import type {FormStorageEventData} from './types/eventData/FormStorageEventData.js'
import {Storage} from './Storage.js'
import type {ChangeEventData} from './types/eventData/ChangeEventData.js'
import type {ActionEventData} from './types/eventData/ActionEventData.js'
import type {Values} from './types/types.js'
import type {FormState} from './types/FormTypes.js'
import type {ErrorMessage} from './types/ErrorMessage.js'
import {FormEvent} from './types/FormTypes.js'


export class FormStorage {
  private readonly storage: Storage


  constructor(storage: Storage) {
    this.storage = storage
  }


  getState(stateName: keyof FormState): any {
    return this.storage.getFormState(stateName)
  }

  /**
   * Get all the combined values of form's fields.
   */
  getCombinedValues(): Values {
    return this.storage.getCombinedValues()
  }

  getEditedValues(): Values {
    const editedValues = {}

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const editedValue: any = field.get('editedValue')

      if (typeof editedValue === 'undefined') return

      deepSet(editedValues, path, editedValue)
    });

    return editedValues
  }

  getSavedValues(): Values {
    const savedValues = {}

    this.storage.eachField((field: Map<string, any>, path: string) => {
      deepSet(savedValues, path, field.get('savedValue'))
    });

    return savedValues
  }

  getUnSavedValues(): Values {
    const unSavedValues = {}

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const editedValue: any = field.get('editedValue')

      if (
        typeof editedValue === 'undefined'
        || field.get('savedValue') === editedValue
      ) return

      // if editedValue has a defined value and it isn't equal to editedValue
      deepSet(unSavedValues, path, field.get('editedValue'))
    });

    return unSavedValues
  }

  getInvalidMessages(): Array<ErrorMessage> {
    const invalidMessages: Array<ErrorMessage> = []

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const msg: string = field.get('invalidMsg')

      if (msg) {
        invalidMessages.push({
          field: path,
          message: field.get('invalidMsg'),
        })
      }
    })

    return invalidMessages
  }

  getWholeState(): Partial<FormState> {

    // TODO: review
    // TODO: где prevValues ?

    return {
      ...this.storage.getWholeFormState(),
      values: this.getCombinedValues(),
    }
  }

  setStateSilent(partlyState: FormState): void {
    this.storage.setFormState(partlyState)
  }

  emitStorageEvent(newState: any, prevState: any, force?: boolean): void {
    if (!force && isEqual(prevState, newState)) return

    const data: FormStorageEventData = {
      target: 'form',
      event: FormEvent.storage,
      state: newState,
      prevState,
    }

    this.emit(FormEvent.storage, data)
  }

  /**
   * Add one or more handlers on form's event:
   * * change - changes of any field made by user
   * * storage - changes of storage
   * * saveStart
   * * saveEnd
   * * submitStart
   * * submitEnd
   * @param eventName
   * @param cb
   */
  on(eventName: FormEvent, cb: (data: FormStorageEventData | ChangeEventData | ActionEventData) => void): number {
    return this.storage.events.addListener(eventName, cb);
  }

  emit(eventName: FormEvent, data: FormStorageEventData | ChangeEventData | ActionEventData): void {
    this.storage.events.emit(eventName, data);
  }

  removeListener(eventName: FormEvent, handlerIndex: number): void {
    this.storage.events.removeListener(eventName, handlerIndex);
  }

  destroy(): void {
    this.storage.destroy();
  }

}
