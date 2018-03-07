const _ = require('lodash');
const { extendDeep, findFieldLikeStructureRecursively } = require('./helpers');


module.exports = class FieldStorage {
  constructor(storage) {
    this._storage = storage;
  }

  initFieldState(pathToField) {
    // TODO: review
    this.setFieldState(pathToField, this._generateNewFieldState(pathToField));
  }

  // TODO: check
  /**
   * get current value
   * @param pathToField
   * @return {*}
   */
  getValue(pathToField) {
    return _.cloneDeep(_.get(this._storage.$store().values, pathToField));
  }

  getState(pathToField, stateName) {
    return _.cloneDeep(_.get(this._storage.$store().fieldsState, `${pathToField}.${stateName}`));
  }

  setAllSavedValues(submittedValues) {
    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field, path) => {
      field.savedValue = _.get(submittedValues, path);
    });
  }


  setValue(pathToField, newValue) {
    _.set(this._storage.$store().values, pathToField, newValue);
  }




  /**
   * Set field's state.
   * @param pathToField
   * @param newState
   */
  setFieldState(pathToField, newState) {
    let field = _.get(this._storage.$store().fieldsState, pathToField);
    if (_.isUndefined(field)) {
      field = {};
      _.set(this._storage.$store().fieldsState, pathToField, field);
    }
    extendDeep(field, newState);
  }

  findFieldStateRecursively(root, cb) {
    return findFieldLikeStructureRecursively(this._storage.$store()[root], cb);
  }

  isFieldUnsaved(pathToField) {
    return _.get(this._storage.$store().fieldsState, pathToField).savedValue !== _.get(this._storage.$store().values, pathToField);
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
