const _ = require('lodash');


module.exports = class FormStorage {
  constructor(storage) {
    this._storage = storage;
  }

  getState(stateName) {
    return this._storage.getFormState(stateName);
  }

  /**
   * Get all the values of form's fields.
   */
  getValues() {
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

  getUnsavedValues() {
    // TODO: test
    const unsavedValues = {};

    const values = this.getValues();

    this._storage.eachField((field, path) => {
      const curValue = _.get(values, path);
      if (field.get('savedValue') !== curValue) {
        _.set(unsavedValues, path, curValue);
      }
    });

    return unsavedValues;
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
   * * change - changes made by user
   * * storage - changes of storage
   * * saveStart
   * * saveEnd
   * * submitStart
   * * submitEnd
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    // TODO: наверное префикс то не нужен!?
    this._storage.events.on(`form.${eventName}`, cb);
  }

  emit(eventName, data) {
    // TODO: наверное префикс то не нужен!?
    this._storage.events.emit(`form.${eventName}`, data);
  }

  off(eventName, cb) {
    // TODO: наверное префикс то не нужен!?
    this._storage.events.off(`form.${eventName}`, cb);
  }

};
