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

  // TODO: used in events
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

  isFieldUnsaved(pathToField) {
    return _.get(this._storage.$store().fieldsState, pathToField).savedValue !== _.get(this._storage.$store().values, pathToField);
  }

  // TODO: used in events
  setAllSavedValues(submittedValues) {
    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field, path) => {
      field.savedValue = _.get(submittedValues, path);
    });
  }

  setValue(pathToField, newValue) {
    _.set(this._storage.$store().values, pathToField, newValue);
  }

  // TODO: remove from storage and rename
  /**
   * Set field's state.
   * @param pathToField
   * @param newState
   */
  setFieldState(pathToField, newState) {
    // TODO: review стратегию обновления
    let field = _.get(this._storage.$store().fieldsState, pathToField);
    if (_.isUndefined(field)) {
      field = {};
      _.set(this._storage.$store().fieldsState, pathToField, field);
    }
    // TODO: review
    extendDeep(field, newState);
  }

  // TODO: remove from storage and rename
  findFieldStateRecursively(root, cb) {
    return findFieldLikeStructureRecursively(this._storage.$store()[root], cb);
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
