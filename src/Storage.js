import _ from 'lodash';
import { extendDeep, findInFieldRecursively } from './helpers';

export default class Storage {
  constructor() {
    this.init();
  }

  // TODO: наверное лучше сделать плоские объекты с ключами "path.to.field"
  // TODO: наверное лучше values и state хранить в единой структуре

  init() {
    this._store = {
      formState: this._generateNewFormState(),
      fieldsState: {},
      values: {},
      unsavedValues: {},
    };
  }

  initFieldState(pathToField) {
    this.setFieldState(pathToField, this._generateNewFieldState(pathToField));
  }

  getWholeStorageState() {
    return _.cloneDeep(this._store);
  }

  /**
   * Get all the values of form's fields.
   */
  getValues() {
    return this._store.values;
  }

  /**
   * get current value
   * @param pathToField
   * @return {*}
   */
  getValue(pathToField) {
    return _.cloneDeep(_.get(this._store.values, pathToField));
  }

  getFormState(stateName) {
    return _.cloneDeep(_.get(this._store.formState, stateName));
  }

  getFieldState(pathToField, stateName) {
    return _.cloneDeep(_.get(this._store.fieldsState, `${pathToField}.${stateName}`));
  }

  updateSavedValues(newValues) {
    // TODO: ??? what's this?
    //extendDeep(this._store.savedValues, newValues);
  }


  setValue(pathToField, newValue) {
    _.set(this._store.values, pathToField, newValue);
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

  clearUnsavedValues() {
    this._store.unsavedValues = {};
  }


  _generateNewFormState() {
    // TODO; add saving
    return {
      dirty: false,
      touched: false,
      submitting: false,
      valid: true,
    };
  }

  _generateNewFieldState() {
    return {
      dirty: false,
      touched: false,
      valid: true,
      invalidMsg: undefined,
      saving: false,
      disabled: false,
      focused: false,
      defaultValue: undefined,
      savedValue: undefined,
    };
  }

}
