import _ from 'lodash';

import FormBase from './FormBase';

export default class Form extends FormBase{
  constructor(storage) {
    super(storage);
    this._onSubmitCallback = null;
  }

  init(initialState) {
    this.setInitialValues(initialState);
  }

  getValues() {
    return this.$storage.getFieldsValues();
  }

  getInitialValues() {
    return this.$storage.getFieldsInitialValues();
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

  onChange(cb) {
    this.$onChangeCallback = cb;
  }

  /**
   * It must be placed to <form> element on onSubmit attribute.
   */
  handleSubmit() {
    if (!this._onSubmitCallback) return;
    this.$formState.setStateValue('submitting', true);
    var returnedValue = this._onSubmitCallback(this.$storage.getFieldsValues());
    // if promise
    if (returnedValue && returnedValue.then) {
      return returnedValue.then(() => {
        this.$formState.setStateValue('submitting', false);
      }, () => {
        this.$formState.setStateValue('submitting', false);
      });
    }
    this.$formState.setStateValue('submitting', false);
  }

  onSubmit(cb) {
    this._onSubmitCallback = cb;
  }

  reset() {
    // TODO: !!!
  }

}
