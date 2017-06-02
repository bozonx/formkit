import _ from 'lodash';

import DebouncedCall from './DebouncedCall';

/**
 * It sets field and form states and rise an event if need
 * @class
 */
export default class Events {
  constructor(form, eventEmitter, storage) {
    this._form = form;
    this._eventEmitter = eventEmitter;
    this._storage = storage;

    this._formHandlers = {
      change: [],
      silent: [],
      any: [],
      save: [],
      submit: [],
    };
    this._fieldsHandlers = {};

    this._formChangeCallback = null;
    this._formSaveCallback = null;
    this._formSubmitCallback = null;

    // TODO: переименовать в приватное или в $$
    this.$debouncedCall = new DebouncedCall(this._form.config.debounceTime);
  }

  getFormCallback(event) {
    return this[`_form${_.capitalize(event)}Callback`];
  }

  setFormCallback(event, cb) {
    this[`_form${_.capitalize(event)}Callback`] = cb;
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
    this._eventEmitter.emit(`form.${eventName}`, data);
  }

  riseFieldEvent(pathToField, eventName, data) {
    this._eventEmitter.emit(`field.${pathToField}.${eventName}`, data);
  }

  addListener(eventName, cb) {
    this._eventEmitter.addListener(eventName, cb);
  }

  // riseFieldDebouncedSave(pathToField, value, force) {
  //   this.$debouncedCall.exec(() => {
  //     this.riseFieldEvent(pathToField, 'save', value);
  //     // TODO: нужно ли убирать из unsaved???
  //   }, force);
  // }

  riseFormDebouncedSave(force) {
    if (_.isEmpty(this._formHandlers.save)) return;

    return this.$debouncedCall.exec(() => {
      // save current state on the moment
      this.riseFormEvent('save', this._storage.getUnsavedValues());
      // TODO: вынести в промис
      this._storage.clearUnsavedValues();
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
    this._eventEmitter.emit('silentChange', eventData);
    this._eventEmitter.emit(`field.${pathToField}.silentChange`, eventData);

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

    // TODO: вынести в промис
    this._storage.setUnsavedValue(pathToField, newValue);

    this._riseAnyChange(pathToField);
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    this._eventEmitter.emit(`field.${pathToField}.anyChange`);
    this._eventEmitter.emit('anyChange');

    // TODO use riseFieldEvent
    // this.riseFormEvent('anyChange');
    // this.riseFieldEvent(pathToField, 'anyChange');
  }

}
