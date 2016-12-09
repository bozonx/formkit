import _ from 'lodash';

import FormBase from './FormBase';
import Field from './Field';

export default class Form extends FormBase{
  constructor(storage, config, events, log) {
    super(storage, config, events, log);
    this._onSubmitCallback = null;
  }

  init(outerValues) {
    _.each(outerValues, (value, fieldName) => {
      // Create new field if it isn't exist
      if (!this.fields[fieldName]) this.__fields[fieldName] = new Field(this, fieldName);
      this.__fields[fieldName].outerValue = value;
    });
  }

  /**
   * It must be placed to <form> element on onSubmit attribute.
   */
  handleSubmit() {
    if (!this._onSubmitCallback) return;
    this.$storage.setFormState('submitting', true);
    const returnedValue = this._onSubmitCallback(this.$storage.values);
    // if promise
    if (returnedValue && returnedValue.then) {
      return returnedValue.then(() => {
        this.$storage.setFormState('submitting', false);
      }, () => {
        this.$storage.setFormState('submitting', false);
      });
    }
    this.$storage.setFormState('submitting', false);
  }

  on(eventName, cb) {
    this.$events.addListener(eventName, cb);
  }

  onChange(cb) {
    this.$handlers.$onChangeCallback = cb;
  }

  onSave(cb) {
    this.$handlers.$onSaveCallback = cb;
  }

  onSubmit(cb) {
    this._onSubmitCallback = cb;
  }

}
