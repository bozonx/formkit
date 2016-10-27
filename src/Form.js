import _ from 'lodash';

import FormState from './FormState';
import FieldsManager from './FieldsManager';

export default class Form {
  constructor(storage) {
    this.$storage = storage;
    this._formState = new FormState(this);
    this._fieldsManager = new FieldsManager(this);

    this._onChangeCallback = null;
    this._onAnyChangeCallback = null;
    this._onSubmitCallback = null;
    this.fields = this._fieldsManager.fields;
  }

  init(initialState) {
    this.setInitialValues(initialState);
  }

  $$handleAnyFieldsValueChange(fieldName, newValue) {
    this._formState.setFieldValue(fieldName, newValue);
    if (this._onAnyChangeCallback) this._onAnyChangeCallback({[fieldName]: newValue});
  }

  $$handleAnyFieldsValueChangeByUser(fieldName, newValue) {
    if (this._onChangeCallback) this._onChangeCallback({[fieldName]: newValue});
  }

  $$handleAnyFieldsInitialValueChange(fieldName, newInitialValue) {
    this._formState.setFieldInitialValue(fieldName, newInitialValue);
  }

  $$handleAnyFieldsStateChange(stateName, newValue) {
    this._formState.setStateValue(stateName, newValue);
  }

  $$handleAnyFieldsValidStateChange(fieldName, isValid, invalidMsg) {
    var newInvalidMessages = { ...this.invalidMsg };
    if (isValid) {
      delete newInvalidMessages[fieldName];
    }
    else {
      newInvalidMessages[fieldName] = invalidMsg;
    }

    this._formState.setStateValue('invalidMsg', newInvalidMessages);

    var isFormValid = _.isEmpty(newInvalidMessages);
    this._formState.setStateValue('valid', isFormValid);
  }

  $getWhoreStorageState() {
    return this.$storage.getWhoreStorageState();
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
    this._fieldsManager.setValues(_.cloneDeep(newValues));
  }

  /**
   * It set initial values for all the fields.
   * It creates a field if it doesn't exist.
   * It set value if it doesn't assign.
   * @param initialState
   */
  setInitialValues(initialState) {
    this._fieldsManager.setInitialValues(initialState);
  }

  onChange(cb) {
    this._onChangeCallback = cb;
  }

  onAnyChange(cb) {
    this._onAnyChangeCallback = cb;
  }

  /**
   * It must be placed to <form> element on onSubmit attribute.
   */
  handleSubmit() {
    if (!this._onSubmitCallback) return;
    this._formState.setStateValue('submitting', true);
    var returnedValue = this._onSubmitCallback(this.$storage.getFieldsValues());
    // if promise
    if (returnedValue && returnedValue.then) {
      return returnedValue.then(() => {
        this._formState.setStateValue('submitting', false);
      }, () => {
        this._formState.setStateValue('submitting', false);
      });
    }
    this._formState.setStateValue('submitting', false);
  }

  onSubmit(cb) {
    this._onSubmitCallback = cb;
  }

  reset() {
    // TODO: !!!
  }
}
