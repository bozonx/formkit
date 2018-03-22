const _ = require('lodash');


module.exports = class FormStorage {
  constructor(storage) {
    this._storage = storage;
  }

  getState(stateName) {
    return this._storage.getFormState(stateName);
  }

  /**
   * Get all the combined values of form's fields.
   */
  getCombinedValues() {
    // TODO: review
    return this._storage.getFormValues();
  }

  /**
   * Get all the values of form's fields.
   */
  getValues() {
    // TODO: не нужно
    return this._storage.getFormValues();
  }

  getSavedValues() {
    const savedValues = {};

    this._storage.eachField((field, path) => {
      _.set(savedValues, path, field.get('savedValue'));
    });

    return savedValues;
  }

  getInvalidMessages() {
    const invalidMessages = [];

    this._storage.eachField((field, path) => {
      if (!field.get('valid') && field.get('invalidMsg')) {
        invalidMessages.push({
          path,
          message: field.get('invalidMsg'),
        });
      }
    });

    return invalidMessages;
  }

  getEditedValues() {
    // TODO: test
    const editedValues = {};

    this._storage.eachField((field, path) => {
      if (_.isUndefined(field.get('editedValue'))) return;
      _.set(editedValues, path, field.get('editedValue'));
    });

    return editedValues;
  }

  /**
   * Set form's state.
   * @param {object} partlyState - new partly state
   */
  setState(partlyState) {
    const oldState = this._storage.getWholeFormState();

    this._storage.setFormState(partlyState);

    if (_.isEqual(oldState, this._storage.getWholeFormState())) return;

    const data = {
      target: 'form',
      state: partlyState,
      oldState,
      event: 'storage',
      action: 'update',
      type: 'state',
    };

    this.emit('storage', data);
  }

  /**
   * Add one or more handlers on form's event:
   * * change - changes of any field made by user
   * * storage - changes of storage
   * * saveStart
   * * saveEnd
   * * submitStart
   * * submitEnd
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    this._storage.events.on(eventName, cb);
  }

  emit(eventName, data) {
    this._storage.events.emit(eventName, data);
  }

  off(eventName, cb) {
    this._storage.events.off(eventName, cb);
  }

  destroy() {
    // TODO: DO IT !!!
  }

};
