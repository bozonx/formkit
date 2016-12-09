import _ from 'lodash';

import FormBase from './FormBase';

export default class Form extends FormBase{
  constructor(storage, config, events, log) {
    super(storage, config, events, log);
    this._onSubmitCallback = null;
  }

  init(initialState) {
    this.setInitialValues(initialState);
  }

  /**
   * It must be placed to <form> element on onSubmit attribute.
   */
  handleSubmit() {
    if (!this._onSubmitCallback) return;
    this.$storage.setFormState('submitting', true);
    var returnedValue = this._onSubmitCallback(this.$storage.getFieldsValues());
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

  /**
   * It set all the values to fields silently.
   * It creates a field if it doesn't exist.
   * @param newValues
   */
  setValues(newValues) {
    this.$fieldsManager.updateValues(_.cloneDeep(newValues));
  }

  /**
   * It set initial values for all the fields.
   * It creates a field if it doesn't exist.
   * It set value if it doesn't assign.
   * @param initialState
   */
  setInitialValues(initialState) {
    this.$fieldsManager.setInitialValues(initialState);
  }
}
