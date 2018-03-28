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
    return this._storage.getCombinedValues();
  }

  getEditedValues() {
    const editedValues = {};

    this._storage.eachField((field, path) => {
      const editedValue = field.get('editedValue');
      if (_.isUndefined(editedValue)) return;
      _.set(editedValues, path, editedValue);
    });

    return editedValues;
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
      const msg = field.get('invalidMsg');

      if (msg) {
        invalidMessages.push({
          field: path,
          message: field.get('invalidMsg'),
        });
      }
    });

    return invalidMessages;
  }

  getWholeState() {
    // TODO: наверное ещё и values возвращать
    return this._storage.getWholeFormState();
  }

  /**
   * Set form's state.
   * @param {object} partlyState - new partly state
   */
  setState(partlyState) {
    // TODO: review
    const oldState = this.getWholeState();

    this._storage.setFormState(partlyState);

    if (_.isEqual(oldState, this._storage.getWholeFormState())) return;

    this.emitStorageEvent('update', partlyState, oldState);
  }

  setStateSilent(partlyState) {
    this._storage.setFormState(partlyState);
  }

  emitStorageEvent(action, newState, oldState, force) {
    if (!force && _.isEqual(oldState, newState)) return;

    const data = {
      target: 'form',
      event: 'storage',
      state: newState,
      oldState,
      action,
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
    this._storage.destroy();
  }

};
