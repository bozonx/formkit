import {isEqual} from 'squidlet-lib'
import type {FieldStorageEventData} from './types/eventData/FieldStorageEventData.js'
import {Storage} from './Storage.js'
import type {FieldState} from './types/FieldTypes.js'
import {FieldEvent} from './types/FieldTypes.js';
import {FormStorage} from './FormStorage.js'
import type {ChangeEventData} from './types/eventData/ChangeEventData.js'


export class FieldStorage {
  private readonly storage: Storage
  private readonly formStorage: FormStorage


  constructor(storage: Storage, formStorage: FormStorage) {
    this.storage = storage
    this.formStorage = formStorage
  }


  initState(pathToField: string, initialState: FieldState): void {
    const newState = {
      ...this.storage.generateNewFieldState(),
      ...initialState,
    }

    this.setStateSilent(pathToField, newState)
  }

  /**
   * get current value
   * @param {string} pathToField - path to your field
   * @return {*}
   */
  getCombinedValue(pathToField: string): any {
    return this.storage.getCombinedValue(pathToField)
  }

  getState(pathToField: string, stateName: keyof FieldState): any {
    return this.storage.getFieldState(pathToField, stateName)
  }

  getWholeState(pathToField: string): Partial<FieldState> | undefined {
    return this.storage.getWholeFieldState(pathToField)
  }

  setStateSilent(pathToField: string, partlyState: Partial<FieldState>): void {
    this.storage.setFieldState(pathToField, partlyState)
  }

  emitStorageEvent(pathToField: string, newState: Partial<FieldState>, prevState?: Partial<FieldState>): void {
    if (isEqual(prevState, newState)) return

    const fieldEventdata: FieldStorageEventData = {
      field: pathToField,
      target: 'field',
      event: 'storage',
      state: newState,
      prevState,
    }

    this.emit(pathToField, FieldEvent.storage, fieldEventdata)

    // const formEventData: FormStorageEventData = {
    //   target: 'form',
    //   event: 'storage',
    //   state: newState,
    //   prevState,
    // };
    // // emit form event
    // this.storage.events.emit('storage', formEventData);
    //
    this.formStorage.emitStorageEvent(newState, prevState);
  }

  on(pathToField: string, event: FieldEvent, cb: (data: FieldStorageEventData| ChangeEventData) => void): number {
    return this.storage.events.addListener(`${pathToField}.${event}`, cb)
  }

  emit(pathToField: string, event: FieldEvent, data: FieldStorageEventData | ChangeEventData): void {
    this.storage.events.emit(`${pathToField}.${event}`, data)
  }

  removeListener(pathToField: string, event: FieldEvent, handlerIndex: number): void {
    this.storage.events.removeListener(handlerIndex, `${pathToField}.${event}`)
  }

  /**
   * Field means unsaved if its value not equal to previously saved value.
   * @param {string} pathToField - path to your field
   * @return {boolean} - true if field unsaved
   */
  isFieldUnsaved(pathToField: string): boolean {
    const savedValue = this.getState(pathToField, 'savedValue')
    const editedValue = this.getState(pathToField, 'editedValue')

    return savedValue !== editedValue
  }

}
