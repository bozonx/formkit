import _ from 'lodash';

import FormBase from './FormBase';


export default class Form extends FormBase{
  constructor(storage, config, events) {
    super(storage, config, events);
    this._onSubmitCallback = null;
  }

  init(initialFields) {
    this.__reinitFields(initialFields);
  }

  /**
   * Roll back to outer value which sat previously.
   */
  resetUserInput() {
    this._resetUserInput();
  }

  /**
   * It must be placed to <form> element on onSubmit attribute.
   * @return {Promise}
   */
  handleSubmit() {
    // TODO: добавить возможность просто запускать handleSubmit без указания _onSubmitCallback

    if (!this.$config.allowSubmitSubmittingForm) {
      // do nothing if form is submitting at the moment
      if (this.$storage.getFormState('submitting')) return;
    }
    if (!this.$config.allowSubmitUnchangedForm) {
      if (!this.$storage.getFormState('dirty')) return;
    }

    this.$storage.setFormState('submitting', true);
    const values = _.clone(this.$storage.getValues());

    // TODO: validate

    return this._handleSubmitCallback(values);
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

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving() {
    this.$handlers.$debouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this.$handlers.$debouncedCall.flush();
  }

  _handleSubmitCallback(values) {
    const updateOuterValues = () => {
      if (this.$config.updateOuterValuesAfterSubmit) {
        this.$storage.updateOuterValues(values);
        this.$updateDirtyStates();
      }
    };

    if (this._onSubmitCallback) {
      const returnedValue = this._onSubmitCallback(values);

      // if promise
      if (returnedValue && returnedValue.then) {
        return returnedValue.then((data) => {
          this.$storage.setFormState('submitting', false);
          updateOuterValues();

          return data;
        }, (err) => {
          this.$storage.setFormState('submitting', false);

          return err;
        });
      }
    }

    // without _onSubmitCallback or with _onSubmitCallback and it doesn't return a promise
    this.$storage.setFormState('submitting', false);
    updateOuterValues();

    return Promise.resolve();
  }

}
