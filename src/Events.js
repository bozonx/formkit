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

    this._formCallbacks = {
      change: null,
      save: null,
      submit: null,
    };
    this._fieldsCallbacks = {};

    this._formSaveDebouncedCall = new DebouncedCall(this._form.config.debounceTime);
  }

  getFormCallback(eventName) {
    return this._formCallbacks[eventName];
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

  riseFieldSave(pathToField, data) {
    const eventName = 'save';
    if (this._fieldsCallbacks[pathToField] && this._fieldsCallbacks[pathToField][eventName]) {
      this._fieldsCallbacks[pathToField][eventName](data);
    }
    this._eventEmitter.emit(`field.${pathToField}.${eventName}`, data);
  }

  riseFormDebouncedSave(force) {
    // TODO: review
    //if (_.isEmpty(this._formHandlers.save)) return;

    return this._formSaveDebouncedCall.exec(() => {
      // save current state on the moment
      const data = this._storage.getUnsavedValues();
      if (this._formCallbacks.save) this._formCallbacks.save(data);
      this._riseFormEvent('save', data);

      // TODO: вынести в промис
      this._storage.clearUnsavedValues();
    }, force);
  }

  // riseFieldDebouncedSave(pathToField, value, force) {
  //   this._formSaveDebouncedCall.exec(() => {
  //     this._riseFieldEvent(pathToField, 'save', value);
  //     // TODO: нужно ли убирать из unsaved???
  //   }, force);
  // }

  /**
   * It calls from field on silent value change (after outer value setting).
   * It means - it calls onlu on value changes by machine.
   * It rises a "silentChange" and "anyChange" events.
   * @param {string} pathToField
   * @param {*} oldValue
   */
  riseSilentChangeEvent(pathToField, oldValue) {
    // TODO: review
    const eventData = {
      fieldName: pathToField,
      oldValue,
      value: this._storage.getValue(pathToField),
    };

    // Rise events
    // TODO use _riseFieldEvent
    this._riseFormEvent('silentChange', eventData);
    this._riseFieldEvent(pathToField, 'silentChange', eventData);
    // this._eventEmitter.emit('silentChange', eventData);
    // this._eventEmitter.emit(`field.${pathToField}.silentChange`, eventData);

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
    // TODO: review
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
    this._riseFieldEvent(pathToField, 'change', eventData);
    // run form's change handler
    this._riseFormEvent('change', { [pathToField]: newValue });

    // TODO: вынести в промис
    this._storage.setUnsavedValue(pathToField, newValue);

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


  _riseFormEvent(eventName, data) {
    this._eventEmitter.emit(`form.${eventName}`, data);
  }

  _riseFieldEvent(pathToField, eventName, data) {
    this._eventEmitter.emit(`field.${pathToField}.${eventName}`, data);
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    this._riseFormEvent('anyChange');
    this._riseFieldEvent(pathToField, 'anyChange');
  }

}
