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

  /**
   * It calls from field on silent value change.
   * It means - it calls on any value change.
   * @param {string} pathToField
   */
  $$handleSilentValueChange(pathToField, oldValue) {
    var values = this.$storage.getFieldsValues();
    var eventData = {
      fieldName: pathToField,
      oldValue,
      value: values[pathToField],
    };

    // It hopes actual value is in storage at the moment
    extendDeep(this, {values: values});

    events.emit('silentChange', eventData);
    events.emit(`field.${pathToField}.silentChange`, eventData);

    // TODO: rise per field change event
    // TODO: rise form change event
  }

  /**
   * It calls form field on value changed by user
   * @param {string} pathToField
   * @param {*} newValue
   */
  $$handleValueChangeByUser(pathToField, newValue) {
    // TODO: get value from storage!
    if (this.$onChangeCallback) this.$onChangeCallback({[pathToField]: newValue});
  }

  $$handleInitialValueChange(pathToField, newInitialValue) {
    this.$formState.setFieldInitialValue(pathToField, newInitialValue);
  }

  $$handleFieldStateChange(stateName, newValue) {
    this.$formState.setStateValue(stateName, newValue);
  }

  $$handleAnyFieldsValidStateChange(pathToField, isValid, invalidMsg) {
    var newInvalidMessages = { ...this.invalidMsg };
    if (isValid) {
      delete newInvalidMessages[pathToField];
    }
    else {
      newInvalidMessages[pathToField] = invalidMsg;
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
    // TODO: !!!
    events.emit('anyChange', {});
  }

  /**
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @private
   */
  $riseChangeByUser() {
    // TODO: !!!
    events.emit('change', {});
  }

  /**
   * It rises a "silentChange" event.
   * It rises on any value change by user or by program.
   * @private
   */
  $riseSilentChange() {
    // TODO: !!!
    events.emit('silentChange', {});
  }
}
