import * as _ from 'lodash';
import { Map } from 'immutable';

import {ErrorMessage} from './Form';
import FormStorageEventData from './interfaces/eventData/FormStorageEventData';
import FormState from './interfaces/FormState';
import Storage from './Storage';
import ChangeEventData from './interfaces/eventData/ChangeEventData';
import ActionEventData from './interfaces/eventData/ActionEventData';


// TODO: может быть вложенный
export type Values = { [index: string]: any };
export type FormEventName = 'change' | 'storage' | 'saveStart' | 'saveEnd' | 'submitStart' | 'submitEnd';
export type FormStateName = 'touched' | 'submitting' | 'saving' | 'valid';


export default class FormStorage {
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

      if (_.isUndefined(editedValue)) return;

      _.set(editedValues, path, editedValue);
    });

    return editedValues;
  }

  getSavedValues(): Values {
    const savedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      _.set(savedValues, path, field.get('savedValue'));
    });

    return savedValues;
  }

  getUnSavedValues(): Values {
    const unSavedValues = {};

    this.storage.eachField((field: Map<string, any>, path: string) => {
      const editedValue: any = field.get('editedValue');

      if (_.isUndefined(editedValue) || field.get('savedValue') === editedValue) return;

      // if editedValue has a defined value and it isn't equal to editedValue
      _.set(unSavedValues, path, field.get('editedValue'));
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
    if (!force && _.isEqual(prevState, newState)) return;

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
  on(eventName: FormEventName, cb: (data: FormStorageEventData | ChangeEventData | ActionEventData) => void): void {
    this.storage.events.on(eventName, cb);
  }

  emit(eventName: FormEventName, data: FormStorageEventData | ChangeEventData | ActionEventData): void {
    this.storage.events.emit(eventName, data);
  }

  off(eventName: FormEventName, cb: (data: FormStorageEventData | ChangeEventData | ActionEventData) => void): void {
    this.storage.events.off(eventName, cb);
  }

  destroy(): void {
    this.storage.destroy();
  }

}
