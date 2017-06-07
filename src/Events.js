import DebouncedCall from './DebouncedCall';
import { isPromise, findInFieldRecursively } from './helpers';

/**
 * It sets field and form states and rise an event if need
 * @class
 */
export default class Events {
  constructor(form, eventEmitter, storage, state) {
    this._form = form;
    this._eventEmitter = eventEmitter;
    this._storage = storage;
    this._state = state;

    this._formCallbacks = {
      change: null,
      save: null,
      submit: null,
    };
    this._fieldsCallbacks = {};

    this._formSaveDebouncedCall = new DebouncedCall(this._form.config.debounceTime);
  }

  getFieldCallback(pathToField, eventName) {
    if (!this._fieldsCallbacks[pathToField]) return;

    return this._fieldsCallbacks[pathToField][eventName];
  }

  setFormCallback(eventName, cb) {
    this._formCallbacks[eventName] = cb;
  }

  setFieldCallback(pathToField, eventName, cb) {
    if (!this._fieldsCallbacks[pathToField]) {
      this._fieldsCallbacks[pathToField] = {
        change: null,
        save: null,
      };
    }

    this._fieldsCallbacks[pathToField][eventName] = cb;
  }

  riseFormDebouncedSave(force) {
    return this._formSaveDebouncedCall.exec(() => this.$startSaving(
      this._storage.getUnsavedValues(),
      this._formCallbacks.save,
      (...p) => this._state.setFormSavingState(...p),
      (...p) => this._riseFormEvent(...p),
    ), force);
  }

  riseFormSubmit(values) {
    this._storage.setFormState('submitting', true);

    const afterSubmitSuccess = () => {
      this._storage.setFormState('submitting', false);
      if (this._form.config.updateSavedValuesAfterSubmit) {
        this._storage.setAllSavedValues(values);
        // update all the dirty states
        findInFieldRecursively(this._form.fields, (field) => {
          field.$recalcDirty();
        });
      }
    };

    if (this._formCallbacks.submit) {
      // run submit callback
      const returnedValue = this._formCallbacks.submit(values);

      // if cb returns a promise - wait for its fulfilling
      if (isPromise(returnedValue)) {
        return returnedValue.then((data) => {
          afterSubmitSuccess();

          return data;
        }, (err) => {
          this._storage.setFormState('submitting', false);

          return err;
        });
      }
      else {
        // else if cb returns any other types - don't wait and finish submit process
        afterSubmitSuccess();

        return Promise.resolve();
      }
    }
    // else if there isn't a submit callback, just finish submit process
    afterSubmitSuccess();

    return Promise.resolve();
  }

  $startSaving(data, saveCb, setSavingState, riseEvent) {
    // set saving: true
    setSavingState(true);
    // rise saveStart event
    riseEvent('saveStart', data);

    const saveEnd = () => {
      // set saving: false
      setSavingState(false);
      // rise saveEnd
      riseEvent('saveEnd');
    };

    if (saveCb) {
      // run save callback
      const cbPromise = saveCb(data);
      if (isPromise(cbPromise)) {
        return cbPromise.then(() => saveEnd());
      }

      // if save callback hasn't returned a promise
      saveEnd();
    }
    else {
      // if there isn't save callback
      saveEnd();
    }
  }

  /**
   * It calls from field on silent value change (after outer value setting).
   * It means - it calls onlu on value changes by machine.
   * It rises a "silentChange" and "anyChange" events.
   * @param {string} pathToField
   * @param {*} oldValue
   */
  riseSilentChangeEvent(pathToField, oldValue) {
    const eventData = {
      fieldName: pathToField,
      oldValue,
      value: this._storage.getValue(pathToField),
    };

    // Rise events
    this.riseFieldEvent(pathToField, 'silentChange', eventData);
    this._riseFormEvent('silentChange', eventData);
    this._riseAnyChange(pathToField);
  }

  /**
   * It calls form field on value changed by user
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @param {string} pathToField
   * @param {*} oldValue
   * @param {*} newValue
   */
  riseUserChangeEvent(pathToField, oldValue, newValue) {
    const eventData = {
      fieldName: pathToField,
      oldValue,
      value: newValue,
    };

    // run field's cb
    if (this._fieldsCallbacks[pathToField] && this._fieldsCallbacks[pathToField].change) {
      this._fieldsCallbacks[pathToField].change(eventData);
    }
    // run forms's cb
    if (this._formCallbacks.change) {
      this._formCallbacks.change({ [pathToField]: newValue });
    }

    // Rise events field's change handler
    this.riseFieldEvent(pathToField, 'change', eventData);
    // run form's change handler
    this._riseFormEvent('change', { [pathToField]: newValue });
    this._riseAnyChange(pathToField);
  }

  addFormListener(eventName, cb) {
    this._eventEmitter.addListener(`form.${eventName}`, cb);
  }

  addFieldListener(pathToField, eventName, cb) {
    this._eventEmitter.addListener(`field.${pathToField}.${eventName}`, cb);
  }

  cancelFormSaving() {
    this._formSaveDebouncedCall.cancel();
  }

  flushFormSaving() {
    this._formSaveDebouncedCall.flush();
  }

  riseFieldEvent(pathToField, eventName, data) {
    this._eventEmitter.emit(`field.${pathToField}.${eventName}`, data);
  }

  _riseFormEvent(eventName, data) {
    this._eventEmitter.emit(`form.${eventName}`, data);
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    this._riseFormEvent('anyChange');
    this.riseFieldEvent(pathToField, 'anyChange');
  }

}
