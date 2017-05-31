import _ from 'lodash';

import DebouncedCall from './DebouncedCall';
import { findInFieldRecursively } from './helpers';

/**
 * It sets field and form states and rise an event if need
 * @class
 */
export default class State {
  constructor(form, events, storage) {
    this._form = form;
    this._events = events;
    this._storage = storage;

    this._formHandlers = {
      change: [],
      silent: [],
      any: [],
      save: [],
      submit: [],
    };
    this._fieldsHandlers = {};
    // TODO: почему здесь хранятся unsaved - наверное надо в Storage?
    this._unsavedState = {};

    // TODO: переименовать в приватное или в $$
    this.$debouncedCall = new DebouncedCall(this._form.config.debounceTime);
  }

  setFormHandler(eventName, cb) {
    this._formHandlers[eventName].push(cb);
    this.addListener(`form.${eventName}`, cb);
  }

  setFieldHandler(pathToField, eventName, cb) {
    if (!this._fieldsHandlers[pathToField]) {
      this._fieldsHandlers[pathToField] = {
        change: [],
        silent: [],
        any: [],
        save: [],
      };
    }

    this._fieldsHandlers[pathToField][eventName].push(cb);
    this.addListener(`field.${pathToField}.${eventName}`, cb);
  }

  riseFormEvent(eventName, data) {
    this._events.emit(`form.${eventName}`, data);
  }

  riseFieldEvent(pathToField, eventName, data) {
    this._events.emit(`field.${pathToField}.${eventName}`, data);
  }

  addListener(eventName, cb) {
    this._events.addListener(eventName, cb);
  }

  // riseFieldDebouncedSave(pathToField, value, force) {
  //   this.$debouncedCall.exec(() => {
  //     this.riseFieldEvent(pathToField, 'save', value);
  //     // TODO: нужно ли убирать из unsaved???
  //   }, force);
  // }

  riseFormDebouncedSave(force) {
    if (_.isEmpty(this._formHandlers.save)) return;

    this.$debouncedCall.exec(() => {
      // save current state on the moment
      this.riseFormEvent('save', this._unsavedState);
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
      oldValue,
      value: this._storage.getValue(pathToField),
    };

    // Rise events
    // TODO use riseFieldEvent
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

    // Rise events field's change handler
    this.riseFieldEvent(pathToField, 'change', eventData);
    // run form's change handler
    this.riseFormEvent('change', { [pathToField]: newValue });

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

  // TODO: наверное надо в field перенести???
  isUnsaved(pathToField) {
    // TODO: test
    return _.has(this._unsavedState, pathToField);
  }


  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    this._events.emit(`field.${pathToField}.anyChange`);
    this._events.emit('anyChange');

    // TODO use riseFieldEvent
    // this.riseFormEvent('anyChange');
    // this.riseFieldEvent(pathToField, 'anyChange');
  }

}
