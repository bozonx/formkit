import * as EventEmitter from 'eventemitter3';
import {ListenerFn} from 'eventemitter3';
import { fromJS, Map } from 'immutable';
const get = require('lodash/get');
const set = require('lodash/set');
const each = require('lodash/each');
const cloneDeep = require('lodash/cloneDeep');

import {FIELD_PATH_SEPARATOR, eachRecursively} from './helpers/helpers';
import FormState from './interfaces/FormState';
import FieldState from './interfaces/FieldState';
import {FormStateName, Values} from './FormStorage';
import {FieldStateName} from './FieldStorage';


export interface ImmutableStore {
  // TODO: наверное надо использвать FormState
  formState: Map<string, any>;
  // TODO: наверное надо использвать FieldState
  fieldsState: {[index: string]: Map<string, any>};
  values: Map<string, any>;
}

export interface Store {
  formState: FormState;
  fieldsState: FieldState;
  values: {[index: string]: any};
}


export default class Storage {
  readonly events: EventEmitter = new EventEmitter();
  private store: ImmutableStore = {
    formState: Map<string, any>(this._generateNewFormState() as any),
    fieldsState: {},
    // combined saved and edited values
    values: Map<string, any>(),
  };

  getWholeStorageState(): Store {
    const store: Store = {
      formState: this.store.formState.toJS(),
      fieldsState: {},
      values: this.store.values.toJS(),
    };

    this.eachField((field: Map<string, any>, path: string) => {
      set(store.fieldsState, path, field.toJS());
    });

    return store;
  }

  getWholeFormState(): FormState {
    return this.store.formState.toJS();
  }

  // TODO: use JsonTypes
  getFormState(stateName: FormStateName): any {
    const formState: FormState = this.store.formState.toJS();

    return formState[stateName];
  }

  getCombinedValues(): Values {
    return this.store.values.toJS();
  }

  getListeners(name: string): ListenerFn[] {
    return this.events.listeners(name);
  }

  destroy(): void {

    // TODO: do it in right way
    this.store = {
      formState: Map(),
      fieldsState: {},
      values: Map(),
    };

    const eventNames: Array<string> = this.events.eventNames() as Array<string>;

    // TODO: remake to for of
    each(eventNames, (name: string) => {
      // get handlers by name
      each(this.getListeners(name), (handler: ListenerFn) => {
        this.events.off(name, handler);
      });
    });
  }

  setFormState(partlyState: FormState): void {
    const prevState = this.getWholeFormState();

    this.store.formState = fromJS({
      ...prevState,
      ...partlyState,
    });
  }

  eachField(cb: (field: Map<string, any>, path: string) => void): void {
    eachRecursively(this.store.fieldsState, (field: Map<string, any>, path: string): false | undefined => {
      if (!field || !Map.isMap(field)) return;

      cb(field, path);

      return false;
    });
  }

  getWholeFieldState(pathToField: string): FieldState | undefined {
    const fieldState: Map<string, any> | undefined = get(this.store.fieldsState, pathToField);

    if (!fieldState) return;

    return fieldState.toJS();
  }

  getFieldState(pathToField: string, stateName: FieldStateName) {
    const fieldState = get(this.store.fieldsState, pathToField);

    if (!fieldState) return;

    return get(fieldState.toJS(), stateName);
  }

  getCombinedValue(pathToField: string): any {
    const values = this.store.values.toJS();

    return get(values, pathToField);
  }

  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * @param pathToField
   * @param partlyState
   */
  setFieldState(pathToField: string, partlyState: FieldState): void {
    const prevState: FieldState | undefined = this.getWholeFieldState(pathToField);

    const newState: Map<string, any> = fromJS({
      ...prevState,
      ...partlyState,
    });

    set(this.store.fieldsState, pathToField, newState);

    // TODO: ???? !!!! что это ?????
    // _.find(partlyState, (item: any, name: string) => {
    //   if (_.includes([ 'savedValue', 'editedValue' ], name)) return true;
    // });

    this._updateCombinedValue(pathToField, newState.get('savedValue'), newState.get('editedValue'));
  }

  generateNewFieldState(): FieldState {

    // TODO: почему здесь ???

    return {
      defaultValue: undefined,
      dirty: false,
      disabled: false,
      // top layer
      editedValue: undefined,
      focused: false,
      initial: undefined,
      invalidMsg: undefined,
      touched: false,
      // bottom layer
      savedValue: undefined,
      saving: false,
    };
  }

  _generateNewFormState(): FormState {

    // TODO: почему здесь ???

    return {
      touched: false,
      submitting: false,
      saving: false,
      valid: true,
    };
  }

  _updateCombinedValue(pathToField: string, savedValue: any, editedValue: any): void {
    const rawCombinedValue = typeof editedValue === 'undefined' ? savedValue : editedValue;
    const combinedValue = cloneDeep(rawCombinedValue);

    this.store.values = this.store.values.setIn(pathToField.split(FIELD_PATH_SEPARATOR), combinedValue);
  }

}
