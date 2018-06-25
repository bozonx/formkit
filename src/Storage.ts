import * as _ from 'lodash';
import * as EventEmitter from 'eventemitter3';
import {ListenerFn} from 'eventemitter3';
import { fromJS, Map } from 'immutable';

import {FIELD_PATH_SEPARATOR, findRecursively} from './helpers/helpers';
import FormState from './interfaces/FormState';
import FieldState from './interfaces/FieldState';
import {FormStateName, Values} from './FormStorage';


export interface Store {
  // TODO: наверное надо использвать FormState
  formState: Map<string, any>;
  // TODO: наверное надо использвать FieldState
  fieldsState: {[index: string]: Map<string, any>};
  values: Map<string, any>;
}


export default class Storage {
  readonly events: EventEmitter = new EventEmitter();
  private readonly store: Store = {
    formState: Map<string, any>(this._generateNewFormState()),
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
      _.set(store.fieldsState, path, field.toJS());
    });

    return store;
  }

  getWholeFormState(): FormState {
    return this.store.formState.toJS();
  }

  getFormState(stateName: FormStateName): boolean {
    const formState = this.store.formState.toJS();

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
    //this.store = {};

    const eventNames: Array<string> = this.events.eventNames() as Array<string>;

    _.each(eventNames, (name: string) => {
      // get handlers by name
      _.each(this.getListeners(name), (handler: ListenerFn) => {
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
    findRecursively(this.store.fieldsState, (field: Map<string, any>, path: string): false | undefined => {
      if (!field || !Map.isMap(field)) return;

      cb(field, path);

      return false;
    });
  }

  getWholeFieldState(pathToField: string): FieldState | undefined {
    const fieldState: Map<string, any> | undefined = _.get(this.store.fieldsState, pathToField);

    if (!fieldState) return;

    return fieldState.toJS();
  }

  getFieldState(pathToField: string, stateName: FormStateName) {
    const fieldState = _.get(this.store.fieldsState, pathToField);

    if (!fieldState) return;

    return _.get(fieldState.toJS(), stateName);
  }

  getCombinedValue(pathToField: string): any {
    const values = this.store.values.toJS();

    return _.get(values, pathToField);
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

    _.set(this.store.fieldsState, pathToField, newState);

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
    const rawCombinedValue = _.isUndefined(editedValue) ? savedValue : editedValue;
    const combinedValue = _.cloneDeep(rawCombinedValue);

    this.store.values = this.store.values.setIn(pathToField.split(FIELD_PATH_SEPARATOR), combinedValue);
  }

}
