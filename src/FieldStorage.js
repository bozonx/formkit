const _ = require('lodash');


module.exports = class FieldStorage {
  constructor(storage) {
    this._storage = storage;
    // handlers of onChange and onSave of fields
    this._handlers = {};
  }

  initState(pathToField, initialState) {
    const newState = {
      ...this._storage.generateNewFieldState(),
      ...initialState,
    };

    this.setState(pathToField, newState);
  }

  /**
   * get current value
   * @param pathToField
   * @return {*}
   */
  getValue(pathToField) {
    // TODO: test
    return this._storage.getValue(pathToField);
  }

  getState(pathToField, stateName) {
    return this._storage.getFieldState(pathToField, stateName);
  }

  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * It rises an "anyChange" event of field
   * @param pathToField
   * @param partlyState
   */
  setState(pathToField, partlyState) {
    const oldState = this._storage.getWholeFieldState(pathToField);

    this._storage.setFieldState(pathToField, partlyState);

    if (_.isEqual(oldState, this._storage.getWholeFieldState(pathToField))) return;

    const data = {
      target: 'field',
      field: pathToField,
      state: partlyState,
      oldState,
      event: 'storage',
      action: 'update',
      type: 'state',
    };

    // TODO: поднимать общее событие, не на на pathToField
    this.emit(pathToField, 'storage', data);
  }

  setValue(pathToField, newValue) {
    const oldValue = this.getValue(pathToField);

    this._storage.setValue(pathToField, newValue);

    if (!_.isEqual(oldValue, this.getValue(pathToField))) {
      const data = {
        target: 'field',
        field: pathToField,
        value: newValue,
        oldValue,
        event: 'storage',
        action: 'replace',
        type: 'value',
      };

      // TODO: поднимать общее событие, не на на pathToField
      this.emit(pathToField, 'storage', data);
    }
  }

  // TODO: test
  getHandler(pathToField, handlerName) {
    if (!this._handlers[pathToField]) return;

    return this._handlers[pathToField][handlerName];
  }

  setHandler(pathToField, handlerName, handler) {
    if (!this._handlers[pathToField]) {
      this._handlers[pathToField] = {};
    }

    this._handlers[pathToField][handlerName] = handler;
  }

  on(pathToField, eventName, cb) {
    this._storage.events.on(`field.${pathToField}.${eventName}`, cb);
  }

  emit(pathToField, eventName, data) {
    this._storage.events.emit(`field.${pathToField}.${eventName}`, data);
  }

  off(pathToField, eventName, cb) {
    this._storage.events.off(`field.${pathToField}.${eventName}`, cb);
  }

  // TODO: test
  isFieldUnsaved(pathToField) {
    return _.get(this._storage.$store().fieldsState, pathToField).savedValue !== _.get(this._storage.$store().values, pathToField);
  }

};
