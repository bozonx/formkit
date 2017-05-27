import _ from 'lodash';
import { extendDeep, findInFieldRecursively } from './helpers';

export default class Storage {
  constructor() {
    this.init();
  }

  init() {
    this._store = {
      formState: this._generateNewFormState(),
      fieldsState: {},
      values: {},
      savedValues: {},
    };
  }

  /**
   * Get all the values of form's fields.
   */
  getValues() {
    return {
      // TODO: add default values
      ...this._store.savedValues,
      ...this._store.values,
    };
  }

  updateSavedValues(newValues) {
    // TODO: ??? what's this?
    extendDeep(this._store.savedValues, newValues);
  }

  initFieldState(pathToField, fieldName) {
    this.setFieldState(pathToField, this._generateNewFieldState(fieldName));
  }

  getWholeStorageState() {
    return _.cloneDeep(this._store);
  }

  getSavedValue(pathToField) {
    return _.cloneDeep(_.get(this._store.savedValues, pathToField));
  }

  /**
   * get current value
   * @param pathToField
   * @return {*}
   */
  getValue(pathToField) {
    return _.cloneDeep(_.get(this._store.values, pathToField));

    // const value = _.get(this._store.values, pathToField);
    // if (!_.isUndefined(value)) return _.cloneDeep(value);
    // // else returns outer value
    //
    // return _.get(this._store.savedValues, pathToField);
  }

  getFormState(stateName) {
    return _.cloneDeep(_.get(this._store.formState, stateName));
  }

  getFieldState(pathToField, stateName) {
    return _.cloneDeep(_.get(this._store.fieldsState, `${pathToField}.${stateName}`));
  }


  setValue(pathToField, newValue) {
    _.set(this._store.values, pathToField, newValue);
  }

  setSavedValue(pathToField, newValue) {
    _.set(this._store.savedValues, pathToField, newValue);
  }

  /**
   * Set form's state. Only primitive, not container or array
   * @param stateName
   * @param newValue
   */
  setFormState(stateName, newValue) {
    _.set(this._store.formState, stateName, newValue);
  }


  /**
   * Set field's state.
   * @param pathToField
   * @param newState
   */
  setFieldState(pathToField, newState) {
    let field = _.get(this._store.fieldsState, pathToField);
    if (_.isUndefined(field)) {
      field = {};
      _.set(this._store.fieldsState, pathToField, field);
    }
    // TODO: может лучше использовать _.update
    extendDeep(field, newState);
  }

  findRecursively(root, cb) {
    return findInFieldRecursively(this._store[root], cb);
  }


  _generateNewFormState() {
    return {
      invalidMsgList: [],
      dirty: false,
      touched: false,
      submitting: false,
      valid: true,
    };
  }

  _generateNewFieldState(name) {
    return {
      name,
      dirty: false,
      touched: false,
      valid: true,
      invalidMsg: undefined,
      saving: false,
      disabled: false,
      focused: false,
      defaultValue: undefined,
    };
  }

}
