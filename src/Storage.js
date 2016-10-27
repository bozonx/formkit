import _ from 'lodash';
import { extendDeep } from './helpers';

export default class Storage {
  constructor() {
    this._store = {
      formState: {},
      // name: value or parent.name: value
      fieldsValue: {},
      fieldsInitialValue: {},
      fieldsState: {},
    };
  }

  generateNewFormState() {
    return {
      initialValues: {},
      dirty: false,
      touched: false,
      submitting: false,
      valid: true,
      invalidMsg: '',
    };
  }

  generateNewFieldState(name) {
    return {
      name: name,
      dirty: false,
      touched: false,
      valid: true,
      invalidMsg: null,
      validateRule: null,
      saving: false,
      //disabled: null,
      //placeholder: null,
      //focused: null,
    };
  }

  getWhoreStorageState() {
    return _.cloneDeep(this._store);
  }

  getFormState() {
    return _.cloneDeep(this._store.formState);
  }

  getFieldValue(pathToField) {
    return _.cloneDeep(_.get(this._store.fieldsValue, pathToField));
  }

  getFieldInitialValue(pathToField) {
    return _.cloneDeep(_.get(this._store.fieldsInitialValue, pathToField));
  }

  getFieldState(pathToField, stateName) {
    return _.cloneDeep(_.get(this._store.fieldsState, `${pathToField}.${stateName}`));
  }

  getFieldsValues() {
    return _.cloneDeep(this._store.fieldsValue);
  }

  getFieldsInitialValues() {
    return _.cloneDeep(this._store.fieldsInitialValue);
  }

  /**
   * Set form's state. Only primitive, not container or array
   * @param stateName
   * @param newValue
   */
  setFormState(stateName, newValue) {
    _.set(this._store, `formState.${stateName}`, newValue);
  }

  /**
   * Set field's value - primitive not container or array
   * @param pathToField
   * @param newValue
   */
  setFieldValue(pathToField, newValue) {
    _.set(this._store, `fieldsValue.${pathToField}`, newValue);
  }

  /**
   * Set field's value - primitive not container or array
   * @param pathToField
   * @param newValue
   */
  setFieldInitialValue(pathToField, newValue) {
    _.set(this._store, `fieldsInitialValue.${pathToField}`, newValue);
  }

  /**
   * Set field's state - primitive value, not container or array
   * @param pathToField
   * @param newState
   */
  setFieldState(pathToField, newState) {
    //_.set(this._store, `fieldsState.${pathToField}.${stateName}`, newValue);
    if (_.isUndefined(this._store.fieldsState[pathToField])) {
      this._store.fieldsState[pathToField] = {};
    }
    extendDeep(this._store.fieldsState[pathToField], newState);
  }
}
