import _ from 'lodash';

import Storage from './Storage';
import Events from './Events';
import State from './State';
import Field from './Field';
import { findInFieldRecursively } from './helpers';


export default class Form {
  constructor(config, eventEmitter) {
    this._config = config;

    this._fields = {};
    // TODO: move to events
    this._onSubmitCallback = null;

    this._storage = new Storage();
    this._state = new State(this, this._storage);
    this._events = new Events(this, eventEmitter, this._storage);
  }

  get fields() {
    return this._fields;
  }
  get values() {
    return this._storage.getValues();
  }
  get dirty() {
    return this._storage.getFormState('dirty');
  }
  get touched() {
    return this._storage.getFormState('touched');
  }
  get saving() {
    return this._storage.getSaving();
  }
  get submitting() {
    return this._storage.getFormState('submitting');
  }
  get valid() {
    return this._storage.getFormState('valid');
  }
  get config() {
    return this._config;
  }

  /**
   * Get all messages of invalid fields
   * @return {object} like {"path.to.field": "msg"}
   */
  get invalidMessages() {
    const invalidMessages = {};
    findInFieldRecursively(this.fields, (field) => {
      if (!field.valid && field.invalidMsg) {
        invalidMessages[field.path] = field.invalidMsg;
      }
    });

    return invalidMessages;
  }

  /**
   * It calls from outer app's code to init form.
   * @param {array|object} initialFields
   *   * if array: you can pass just fields name like: ['id', 'title', 'body']
   *   * if object: you can pass a fields config like: {name: {default: 'no name', validate: () => {}, ...}}
   */
  init(initialFields) {
    if (_.isArray(initialFields)) {
      _.each(initialFields, (pathToField) => this._initField(pathToField, {}));
    }
    else if (_.isPlainObject(initialFields)) {
      _.each(initialFields, (params, pathToField) => this._initField(pathToField, params || {}));
    }
    else {
      throw new Error(`Bad type of field's param`);
    }
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
    this._events.addListener(eventName, cb);
  }

  /**
   * Add only one handler of 'change' event. It usefull for use as handler of component.
   * @param cb
   */
  onChange(cb) {
    this._events.setFormHandler('change', cb);
  }

  onSave(cb) {
    this._events.setFormHandler('save', cb);
  }

  onSubmit(cb) {
    this._onSubmitCallback = cb;
  }


  /**
   * It can be placed ad a handler of <form> element on onSubmit attribute.
   * @return {Promise}
   */
  handleSubmit() {
    // TODO: добавить возможность просто запускать handleSubmit без указания _onSubmitCallback
    // TODO: должно поддерживать cancelSaving() and flushSaving()

    if (!this._config.allowSubmitSubmittingForm) {
      // do nothing if form is submitting at the moment
      if (this._storage.getFormState('submitting')) return;
    }
    if (!this._config.allowSubmitUnchangedForm) {
      if (!this._storage.getFormState('dirty')) return;
    }

    this._storage.setFormState('submitting', true);
    const values = _.clone(this._storage.getValues());

    // TODO: validate

    return this._handleSubmitCallback(values);
  }

  /**
   * Roll back to previously saved values.
   */
  clear() {
    findInFieldRecursively(this.fields, (field) => field.clear());
  }

  /**
   * Reset values to default values.
   */
  reset() {
    findInFieldRecursively(this.fields, (field) => field.reset());
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving() {
    this._events.$debouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._events.$debouncedCall.flush();
  }

  /**
   * Set form's values without rise a "change event"
   * @param newValues
   */
  setValues(newValues) {
    // TODO: test nested values
    _.each(newValues, (value, fieldName) => {
      if (this.fields[fieldName]) this.fields[fieldName].setValue(value);
    });
  }

  /**
   * Set saved values and update values.
   * @param newValues
   */
  setSavedValues(newValues) {
    // TODO: test nested values
    _.each(newValues, (value, fieldName) => {
      if (this.fields[fieldName]) this.fields[fieldName].setSavedValue(value);
    });
  }

  $getWholeStorageState() {
    return this._storage.getWholeStorageState();
  }


  /**
   * Initialize a field.
   * @param pathToField
   * @param {object} params - { initial, defaultValue, disabled, validate, debounceTime }
   * @private
   */
  _initField(pathToField, params) {
    if (!pathToField) throw new Error(`You must pass a field's name or path!`);
    // Try to get existent field
    const existentField = _.get(this.fields, pathToField);
    if (existentField) throw new Error(`The field "${pathToField}" is exist! You can't reinitialize it!`);

    // create new one
    const newField = new Field(pathToField, params, {
      form: this,
      events: this._events,
      storage: this._storage,
      state: this._state,
    });
    _.set(this.fields, pathToField, newField);
  }

  _updateAllDirtyStates() {
    findInFieldRecursively(this.fields, (field) => {
      field.$recalcDirty();
    });
  }

  _handleSubmitCallback(values) {
    // TODO: make simpler
    // TODO: review - especially updateSavedValues

    const updateSavedValues = () => {
      if (this._config.updateSavedValuesAfterSubmit) {
        // TODO: WTF???
        this._storage.updateSavedValues(values);
        this._updateAllDirtyStates();
      }
    };


    if (this._onSubmitCallback) {
      const returnedValue = this._onSubmitCallback(values);

      // if promise
      if (returnedValue && returnedValue.then) {
        return returnedValue.then((data) => {
          this._storage.setFormState('submitting', false);
          updateSavedValues();

          return data;
        }, (err) => {
          this._storage.setFormState('submitting', false);

          return err;
        });
      }
    }

    // without _onSubmitCallback or with _onSubmitCallback and it doesn't return a promise
    this._storage.setFormState('submitting', false);
    updateSavedValues();

    return Promise.resolve();
  }

}
