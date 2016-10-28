import _ from 'lodash';

import { extendDeep } from './helpers';
import events from './events';
import FormState from './FormState';
import FieldsManager from './FieldsManager';

export default class FormBase {
  constructor(storage) {
    this.$storage = storage;
    this.$formState = new FormState(this);
    this.$fieldsManager = new FieldsManager(this);

    this.$onChangeCallback = null;
    this.fields = this.$fieldsManager.fields;
  }

  init(initialState) {
    this.setInitialValues(initialState);
  }

  $$handleAnyFieldsValueChange(fieldName) {
    // It hopes actual value is in storage at the moment
    extendDeep(this, {values: this.$storage.getFieldsValues()});

    // TODO: rise per field change event
    // TODO: rise form change event
  }

  $$handleAnyFieldsValueChangeByUser(fieldName, newValue) {
    if (this.$onChangeCallback) this.$onChangeCallback({[fieldName]: newValue});
  }

  $$handleAnyFieldsInitialValueChange(fieldName, newInitialValue) {
    this.$formState.setFieldInitialValue(fieldName, newInitialValue);
  }

  $$handleAnyFieldsStateChange(stateName, newValue) {
    this.$formState.setStateValue(stateName, newValue);
  }

  $$handleAnyFieldsValidStateChange(fieldName, isValid, invalidMsg) {
    var newInvalidMessages = { ...this.invalidMsg };
    if (isValid) {
      delete newInvalidMessages[fieldName];
    }
    else {
      newInvalidMessages[fieldName] = invalidMsg;
    }

    this.$formState.setStateValue('invalidMsg', newInvalidMessages);

    var isFormValid = _.isEmpty(newInvalidMessages);
    this.$formState.setStateValue('valid', isFormValid);
  }

  $getWhoreStorageState() {
    return this.$storage.getWhoreStorageState();
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  $riseAnyChange() {
    events.emit('anyChange', {});
  }

  /**
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @private
   */
  $riseChangeByUser() {
    events.emit('change', {});
  }

  /**
   * It rises a "silentChange" event.
   * It rises on any value change by user or by program.
   * @private
   */
  $riseSilentChange() {
    events.emit('silentChange', {});
  }

  // _updateFormState(newState) {
  //   // TODO: нужна поддержка простых массивов - удаленные элементы останутся
  //   extendDeep(this, newState);
  // }
}
