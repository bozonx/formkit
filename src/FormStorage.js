const _ = require('lodash');
const { findFieldLikeStructureRecursively, isPromise, findInFieldRecursively } = require('./helpers');


module.exports = class FormStorage {
  constructor(storage) {
    this._storage = storage;
    // handlers of onChange, onSubmit and onSave of form
    this._handlers = {};
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

  getUnsavedValues() {
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

  getInvalidMessages() {
    const invalidMessages = [];

    this._storage.eachField((field) => {
      if (!field.get('valid') && field.get('invalidMsg')) {
        invalidMessages.push({
          path: field.get('path'),
          message: field.get('invalidMsg'),
        });
      }
    });

    return invalidMessages;
  }

  /**
   * Set form's state.
   * @param {object} partlyState - new partly state
   */
  setState(partlyState) {
    const oldState = this._storage.getWholeFormState();

    this._storage.setFieldState(partlyState);

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

  getHandler(handlerName) {
    return this._handlers[handlerName];
  }

  setHandler(handlerName, handler) {
    this._handlers[handlerName] = handler;
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







  setAllSavedValues(submittedValues) {
    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field, path) => {
      field.savedValue = _.get(submittedValues, path);
    });
  }

  riseFormDebouncedSave(force) {
    return this._formSaveDebouncedCall.exec(() => this.$startSaving(
      this._storage.getUnsavedValues(),
      // TODO: review
      this._formCallbacks.save,
      // TODO: setState неправильно используется
      (...p) => this.setState('saving', ...p),
      (...p) => this._riseFormEvent(...p),
    ), force);
  }


  cancelSaving() {
    this._formSaveDebouncedCall.cancel();
  }

  flushSaving() {
    this._formSaveDebouncedCall.flush();
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

};
