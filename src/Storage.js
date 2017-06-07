import _ from 'lodash';
import { extendDeep, findRecursively } from './helpers';

export default class Storage {
  constructor() {
    this.init();
  }

  init() {
    this._store = {
      formState: this._generateNewFormState(),
      fieldsState: {},
      values: {},
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
  getFormValues() {
    return this._store.values;
  }

  getFormSavedValues() {
    const savedValues = {};

    findRecursively(this._store.fieldsState, (field, path) => {
      _.set(savedValues, path, field.savedValue);
    });

    return savedValues;
  }

  /**
   * Returns true if form or one or more of its field is saving.
   */
  getFormSaving() {
    if (this._store.formState.saving) return true;

    return !!findRecursively(this._store.fieldsState, (field) => {
      if (field.saving) return true;
    });
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

  setAllSavedValues(submittedValues) {
    findRecursively(this._store.fieldsState, (field, path) => {
      field.savedValue = _.get(submittedValues, path);
    });
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
    extendDeep(field, newState);
  }

  findRecursively(root, cb) {
    return findRecursively(this._store[root], cb);
  }


  getFormUnsavedValues() {
    const unsavedValues = {};

    findRecursively(this._store.fieldsState, (field, path) => {
      const curValue = _.get(this._store.values, path);
      if (field.savedValue !== curValue) {
        _.set(unsavedValues, path, curValue);
      }
    });

    return unsavedValues;
  }

  isFieldUnsaved(pathToField) {
    return _.get(this._store.fieldsState, pathToField).savedValue !== _.get(this._store.values, pathToField);
  }


  _generateNewFormState() {
    return {
      dirty: false,
      touched: false,
      submitting: false,
      valid: true,
      saving: false,
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
