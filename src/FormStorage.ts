import { Map } from 'immutable';
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

import type {ErrorMessage} from './Form.js'
import type {FormStorageEventData} from './types/eventData/FormStorageEventData.js'
import type {FormState} from './types/FormState.js'
import {Storage} from './Storage.js'
import type {ChangeEventData} from './types/eventData/ChangeEventData.js'
import type {ActionEventData} from './types/eventData/ActionEventData.js'


// TODO: может быть вложенный
export type Values = { [index: string]: any };
export type FormEventName = 'change' | 'storage' | 'saveStart' | 'saveEnd' | 'submitStart' | 'submitEnd';
export type FormStateName = 'touched' | 'submitting' | 'saving' | 'valid';


export class FormStorage {
  private readonly storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  // TODO: use JsonTypes
  getState(stateName: FormStateName): any {
    return this.storage.getFormState(stateName);
  }

  /**
   * Get all the combined values of form's fields.
   */
  getCombinedValues(): Values {
    return this.storage.getCombinedValues();
  }

  getEditedValues(): Values {
    const editedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const editedValue: any = field.get('editedValue');

      if (typeof editedValue === 'undefined') return;

      set(editedValues, path, editedValue);
    });

    return editedValues;
  }

  getSavedValues(): Values {
    const savedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      set(savedValues, path, field.get('savedValue'));
    });

    return savedValues;
  }

  getUnSavedValues(): Values {
    const unSavedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const editedValue: any = field.get('editedValue');

      if (typeof editedValue === 'undefined' || field.get('savedValue') === editedValue) return;

      // if editedValue has a defined value and it isn't equal to editedValue
      set(unSavedValues, path, field.get('editedValue'));
    });

    return unSavedValues;
  }

  getInvalidMessages(): Array<ErrorMessage> {
    const invalidMessages: Array<ErrorMessage> = [];

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const msg: string = field.get('invalidMsg');

      if (msg) {
        invalidMessages.push({
          field: path,
          message: field.get('invalidMsg'),
        });
      }
    });

    return invalidMessages;
  }

  getWholeState(): FormState {

    // TODO: review
    // TODO: где prevValues ?

    return {
      ...this.storage.getWholeFormState(),
      values: this.getCombinedValues(),
    };
  }

  setStateSilent(partlyState: FormState): void {
    this.storage.setFormState(partlyState);
  }

  emitStorageEvent(newState: any, prevState: any, force?: boolean): void {
    if (!force && isEqual(prevState, newState)) return;

    const data: FormStorageEventData = {
      target: 'form',
      event: 'storage',
      state: newState,
      prevState,
    };

    this.emit('storage', data);
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
  on(eventName: FormEventName, cb: (data: FormStorageEventData | ChangeEventData | ActionEventData) => void): number {
    return this.storage.events.addListener(eventName, cb);
  }

  emit(eventName: FormEventName, data: FormStorageEventData | ChangeEventData | ActionEventData): void {
    this.storage.events.emit(eventName, data);
  }

  removeListener(eventName: FormEventName, handlerIndex: number): void {
    this.storage.events.removeListener(eventName, handlerIndex);
  }

  destroy(): void {
    this.storage.destroy();
  }

}
