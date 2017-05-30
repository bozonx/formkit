import _ from 'lodash';

import DebouncedCall from './DebouncedCall';
import { findInFieldRecursively } from './helpers';

/**
 * It sets field and form states and rise an event if need
 * @class
 */
export default class State {
  constructor(form, events, storage) {
    // TODO: rename to onFormChangeCallback
    this._onFormChangeCallback = null;
    // TODO: rename to onFormSaveCallback
    this.$onSaveCallback = null;

    this._form = form;
    this._events = events;
    this._storage = storage;
    // TODO: почему здесь хранятся unsaved - наверное надо в Storage?
    this._unsavedState = {};

    this.$debouncedCall = new DebouncedCall(this._form.config.debounceTime);
  }

  setFormChangeCallback(cb) {
    this._onFormChangeCallback = cb;
  }

  addListener(eventName, cb) {
    this._events.addListener(eventName, cb);
  }

  // TODO: наверное надо в field перенести???
  isUnsaved(pathToField) {
    // TODO: test
    return _.has(this._unsavedState, pathToField);
  }

  /**
   * It calls form field on debounced save handler.
   * @param {boolean} force
   */
  handleFieldSave(force) {
    // TODO: review
    if (!this.$onSaveCallback) return;

    this.$debouncedCall.exec(() => {
      // save current state on the moment
      this.$onSaveCallback(this._unsavedState);
      this._unsavedState = {};
    }, force);
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
      oldValue: oldValue,
      value: this._storage.getValue(pathToField),
    };

    // Rise events
    this._events.emit('silentChange', eventData);
    this._events.emit(`field.${pathToField}.silentChange`, eventData);

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

    // run form's on change callback
    if (this._onFormChangeCallback) this._onFormChangeCallback({ [pathToField]: newValue });

    // Rise events form's and field's events
    this._events.emit('change', eventData);
    this._events.emit(`field.${pathToField}.change`, eventData);

    _.set(this._unsavedState, pathToField, newValue);

    this._riseAnyChange(pathToField);
  }

  setFieldAndFormTouched(pathToField) {
    this._storage.setFieldState(pathToField, { touched: true });
    this._storage.setFormState('touched', true);
  }

  setFieldAndFormDirty(pathToField, newDirtyValue) {
    this._storage.setFieldState(pathToField, { dirty: newDirtyValue });

    if (newDirtyValue) {
      this._storage.setFormState('dirty', true);
    }
    else {
      // TODO: ??? может лучше ничего не делать???
      // search for other dirty values in other fields
      const hasAnyDirty = this._storage.findRecursively('fieldsState', (field) => {
        if (field.dirty) return true;
      });

      this._storage.setFormState('dirty', !!hasAnyDirty);
    }
  }

  setFieldAndFormValidState(pathToField, isValid, invalidMsg) {
    this._storage.setFieldState(pathToField, {
      valid: isValid,
      invalidMsg,
    });

    const hasAnyErrors = !!findInFieldRecursively(this._form.fields, (field) => {
      if (!field.valid) return true;
    });

    this._storage.setFormState('valid', !hasAnyErrors);
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    this._events.emit('anyChange');
    this._events.emit(`field.${pathToField}.anyChange`);
  }

}
