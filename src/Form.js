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

    this._storage = new Storage();
    this._state = new State(this, this._storage);
    this._events = new Events(this, eventEmitter, this._storage, this._state);
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
    return this._storage.getFormSaving();
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
    this._events.addFormListener(eventName, cb);
  }

  /**
   * Add only one callback of 'change' event. It usefull for use as handler of component.
   * @param {function} cb
   */
  onChange(cb) {
    this._events.setFormCallback('change', cb);
  }

  onSave(cb) {
    this._events.setFormCallback('save', cb);
  }

  onSubmit(cb) {
    this._events.setFormCallback('submit', cb);
  }


  /**
   * It can be placed ad a handler of <form> element on onSubmit attribute.
   * @return {Promise}
   */
  handleSubmit() {
    // disallow submit invalid form
    if (!this.valid) return Promise.reject(new Error(`The form is invalid`));

    if (!this._config.allowSubmitSubmittingForm) {
      // do nothing if form is submitting at the moment
      if (this._storage.getFormState('submitting')) return Promise.reject(new Error(`The form is submitting now.`));
    }
    if (!this._config.allowSubmitUnchangedForm) {
      if (!this._storage.getFormState('dirty')) return Promise.reject(new Error(`The form hasn't changed`));
    }

    return this._handleSubmitCallback();
  }

  /**
   * Start form save immediately.
   * @return {Promise}
   */
  save() {
    if (!this.valid) return Promise.reject(new Error('Form is invalid'));

    return this._events.riseFormDebouncedSave(true);
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
   * Cancel saving
   */
  cancelSaving() {
    // TODO: test
    this._events.cancelFormSaving();
  }

  /**
   * Cancel submitting
   */
  cancelSubmitting() {
    // TODO: add
    // TODO: test
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._events.flushFormSaving();
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
   * Set values to "saved" level and update current values.
   * It usually runs after saving has successfully done.
   * It needs if you want to rollback user changes to previously saved values.
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

  _handleSubmitCallback() {
    const values = _.clone(this._storage.getValues());
    this._storage.setFormState('submitting', true);

    // TODO: make simpler
    // TODO: review - especially updateSavedValues

    const updateSavedValues = () => {
      if (this._config.updateSavedValuesAfterSubmit) {
        // TODO: WTF???
        this._storage.updateSavedValues(values);
        this._updateAllDirtyStates();
      }
    };


    if (this._events.getFormCallback('submit')) {
      // TODO: поднять startSubmit and endSubmit
      const returnedValue = this._events.getFormCallback('submit')(values);

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
