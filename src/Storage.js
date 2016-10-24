import _ from 'lodash';

export default class Storage {
  constructor() {
    this._storage = null;
  }

  /**
   * Set new storage.
   * This method runs one time from State.js.
   * Don't run it from your application.
   * @param {object} newStorage
   */
  $init(newStorage) {
    this._storage = newStorage;
  }

  /**
   * Get field state.
   * @param {string} fieldName
   * @returns {*} - value by path
   */
  get(fieldName) {
    return this._storage[fieldName];
  }

  /**
   * Update field value.
   * @param {string} fieldName
   * @param {*} newValue
   */
  update(fieldName, newState) {
    // it doesn't validate name or value, because it hopes its are correct.
    _.defaultsDeep(newState, this._storage[fieldName]);
  }

}
