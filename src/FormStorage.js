const _ = require('lodash');
const EventEmitter = require('eventemitter3');
const { findFieldLikeStructureRecursively, isPromise, findInFieldRecursively } = require('./helpers');


module.exports = class FormStorage {
  constructor(storage) {
    this._events = new EventEmitter();
    this._storage = storage;
  }

  setFormSavingState(value) {
    this._storage.setFormState('saving', value);
  }

  /**
   * Add one or more handlers on form's event:
   * * change
   * * silentChange
   * * anyChange
   * * saveStart
   * * saveEnd
   * * submitStart
   * * submitEnd
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    this._eventEmitter.addListener(`form.${eventName}`, cb);
  }


  /**
   * Add listener of form events
   * @param {string} formEvent - events: change, save, submit
   * @param {function} handler - event handler
   */
  addCallback(formEvent, handler) {
    // TODO: remove prpevious listeners, ну или может реально использовать колбэки
    this._events.on(formEvent, handler);
  }


  riseFormSubmit(values) {
    this._storage.setFormState('submitting', true);
    this._riseFormEvent('submitStart', values);

    const afterSubmitSuccess = () => {
      this._storage.setFormState('submitting', false);
      if (this._form.config.allowUpdateSavedValuesAfterSubmit) {
        this._storage.setAllSavedValues(values);
        // update all the dirty states
        findInFieldRecursively(this._form.fields, (field) => {
          field.$recalcDirty();
        });
      }
      this._riseFormEvent('submitEnd');
    };

    if (this._formCallbacks.submit) {
      // run submit callback
      const returnedValue = this._formCallbacks.submit(values);

      // if cb returns a promise - wait for its fulfilling
      if (isPromise(returnedValue)) {
        return returnedValue.then((data) => {
          afterSubmitSuccess();

          return data;
        }, (error) => {
          this._storage.setFormState('submitting', false);
          this._riseFormEvent('submitEnd', { error });

          return Promise.reject(error);
        });
      }
      else {
        // else if cb returns any other types - don't wait and finish submit process
        afterSubmitSuccess();

        return Promise.resolve(values);
      }
    }
    // else if there isn't a submit callback, just finish submit process
    afterSubmitSuccess();

    return Promise.resolve(values);
  }

  riseFormDebouncedSave(force) {
    return this._formSaveDebouncedCall.exec(() => this.$startSaving(
      this._storage.getFormUnsavedValues(),
      // TODO: review
      this._formCallbacks.save,
      (...p) => this._state.setFormSavingState(...p),
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

  /**
   * Set form's state. Only primitive, not container or array
   * @param stateName
   * @param newValue
   */
  setFormState(stateName, newValue) {
    _.set(this._storage.$store().formState, stateName, newValue);
  }

};
