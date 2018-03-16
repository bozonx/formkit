const _ = require('lodash');
const { findFieldLikeStructureRecursively, isPromise, findInFieldRecursively } = require('./helpers');


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
   * @param {string} stateName - param name
   * @param {*} newValue - new value
   */
  setState(stateName, newValue) {
    this._storage.setFormState(stateName, newValue);
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
    this.setState('submitting', true);
    this._riseFormEvent('submitStart', values);

    const afterSubmitSuccess = () => {
      this.setState('submitting', false);
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
          this.setState('submitting', false);
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
      this._storage.getUnsavedValues(),
      // TODO: review
      this._formCallbacks.save,
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
