const _ = require('lodash');
const { extendDeep, findFieldLikeStructureRecursively } = require('./helpers');


module.exports = class Storage {
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

  $store() {
    return this._store;
  }

  getWholeStorageState() {
    return _.cloneDeep(this._store);
  }



  // TODO: review
  /**
   * Set form's state. Only primitive, not container or array
   * @param stateName
   * @param newValue
   */
  setFormState(stateName, newValue) {
    _.set(this._store.formState, stateName, newValue);
  }
  // TODO: remove
  getFormUnsavedValues() {
    const unsavedValues = {};

    findFieldLikeStructureRecursively(this._store.fieldsState, (field, path) => {
      const curValue = _.get(this._store.values, path);
      if (field.savedValue !== curValue) {
        _.set(unsavedValues, path, curValue);
      }
    });

    return unsavedValues;
  }





  initFieldState(pathToField) {
    // TODO: review
    this.setFieldState(pathToField, this._generateNewFieldState(pathToField));
  }

  /**
   * get current value
   * @param pathToField
   * @return {*}
   */
  getValue(pathToField) {
    return _.cloneDeep(_.get(this._store.values, pathToField));
  }

  setAllSavedValues(submittedValues) {
    findFieldLikeStructureRecursively(this._store.fieldsState, (field, path) => {
      field.savedValue = _.get(submittedValues, path);
    });
  }


  setValue(pathToField, newValue) {
    _.set(this._store.values, pathToField, newValue);
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

  findFieldStateRecursively(root, cb) {
    return findFieldLikeStructureRecursively(this._store[root], cb);
  }

  isFieldUnsaved(pathToField) {
    return _.get(this._store.fieldsState, pathToField).savedValue !== _.get(this._store.values, pathToField);
  }


  _generateNewFormState() {
    return {
      dirty: false,
      touched: false,
      submitting: false,
      saving: false,
    };
  }

  _generateNewFieldState() {
    return {
      dirty: false,
      touched: false,
      valid: true,
      invalidMsg: undefined,
      validCombined: true,
      saving: false,
      disabled: false,
      focused: false,
      defaultValue: undefined,
      savedValue: undefined,
    };
  }

};
