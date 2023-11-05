import { fromJS, Map } from 'immutable';
import {deepGet, deepSet, IndexedEventEmitter} from 'squidlet-lib'
import {FIELD_PATH_SEPARATOR, eachRecursively} from './helpers/helpers.js'
import type {FormTypes} from './types/FormTypes.js'
import type {FieldTypes} from './types/FieldTypes.js'
import type {Values} from './FormStorage.js'


type EventHandler = (data: any) => void;

export interface ImmutableStore {
  // TODO: наверное надо использвать FormState
  formState: Map<string, any>;
  // TODO: наверное надо использвать FieldState
  fieldsState: {[index: string]: Map<string, any>};
  values: Map<string, any>;
}

export interface Store {
  formState: FormTypes;
  fieldsState: FieldTypes;
  values: {[index: string]: any};
}


export class Storage {
  readonly events = new IndexedEventEmitter<EventHandler>();
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
      deepSet(store.fieldsState, path, field.toJS());
    });

    return store;
  }

  getWholeFormState(): FormTypes {
    return this.store.formState.toJS();
  }

  // TODO: use JsonTypes
  getFormState(stateName: FieldTypes): any {
    const formState: FormTypes = this.store.formState.toJS();

    return formState[stateName];
  }

  getCombinedValues(): Values {
    return this.store.values.toJS();
  }

  getListeners(name: string): (EventHandler | undefined)[] {
    return this.events.getHandlers(name);
  }

  destroy(): void {

    // TODO: do it in right way
    this.store = {
      formState: Map(),
      fieldsState: {},
      values: Map(),
    };

    this.events.destroy();

    // const eventNames: Array<string> = this.events.eventNames() as Array<string>;
    //
    // // TODO: remake to for of
    // each(eventNames, (name: string) => {
    //   // get handlers by name
    //   each(this.getListeners(name), (handler: ListenerFn) => {
    //     this.events.off(name, handler);
    //   });
    // });
  }

  setFormState(partlyState: FormTypes): void {
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

  getWholeFieldState(pathToField: string): FieldTypes | undefined {
    const fieldState: Map<string, any> | undefined = deepGet(this.store.fieldsState, pathToField);

    if (!fieldState) return;

    return fieldState.toJS();
  }

  getFieldState(pathToField: string, stateName: FieldStateName) {
    const fieldState = deepGet(this.store.fieldsState, pathToField);

    if (!fieldState) return;

    return deepGet(fieldState.toJS(), stateName);
  }

  getCombinedValue(pathToField: string): any {
    const values = this.store.values.toJS();

    return deepGet(values, pathToField);
  }

  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * @param pathToField
   * @param partlyState
   */
  setFieldState(pathToField: string, partlyState: FieldTypes): void {
    const prevState: FieldTypes | undefined = this.getWholeFieldState(pathToField);

    const newState: Map<string, any> = fromJS({
      ...prevState,
      ...partlyState,
    });

    deepSet(this.store.fieldsState, pathToField, newState);

    // TODO: ???? !!!! что это ?????
    // _.find(partlyState, (item: any, name: string) => {
    //   if (_.includes([ 'savedValue', 'editedValue' ], name)) return true;
    // });

    this._updateCombinedValue(pathToField, newState.get('savedValue'), newState.get('editedValue'));
  }

  generateNewFieldState(): FieldTypes {

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

  _generateNewFormState(): FormTypes {

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
