const _ = require('lodash');
const { findFieldLikeStructureRecursively } = require('./helpers');


module.exports = class Storage {
  constructor(storage) {
    this._storage = storage;
  }

  /**
   * Get all the values of form's fields.
   */
  getValues() {
    return this._storage.$store().values;
  }

  getSavedValues() {
    const savedValues = {};

    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field, path) => {
      _.set(savedValues, path, field.savedValue);
    });

    return savedValues;
  }

  /**
   * Returns true if form or one or more of its field is saving.
   */
  isSaving() {
    if (this._storage.$store().formState.saving) return true;

    return !!findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field) => {
      if (field.saving) return true;
    });
  }

  isValid() {
    let valid = true;

    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field) => {
      if (!field.valid) {
        valid = false;

        return true;
      }
    });

    return valid;
  }

  getState(stateName) {
    return _.cloneDeep(_.get(this._storage.$store().formState, stateName));
  }

  // TODO: rename to getUnsavedValues
  getFormUnsavedValues() {
    const unsavedValues = {};

    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field, path) => {
      const curValue = _.get(this._storage.$store().values, path);
      if (field.savedValue !== curValue) {
        _.set(unsavedValues, path, curValue);
      }
    });

    return unsavedValues;
  }

  // TODO: !!!! review
  /**
   * Set form's state. Only primitive, not container or array
   * @param stateName
   * @param newValue
   */
  setFormState(stateName, newValue) {
    _.set(this._storage.$store().formState, stateName, newValue);
  }

};
