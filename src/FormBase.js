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
   * It rises a "silentChange" event.
   * It rises on any value change by user or by program.
   * @param {string} pathToField
   * @param {*} oldValue
   */
  $$handleSilentValueChange(pathToField, oldValue) {
    var eventData = {
      fieldName: pathToField,
      oldValue,
      value: this.$storage.getFieldValue(pathToField),
    };

    // It hopes actual value is in storage at the moment
    extendDeep(this, {values: this.$storage.getFieldsValues()});

    // Rise events
    events.emit('silentChange', eventData);
    events.emit(`field.${pathToField}.silentChange`, eventData);

    // TODO: ну только отсюда должно подниматься событие
    this._riseAnyChange(pathToField);
  }

  /**
   * It calls form field on value changed by user
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @param {string} pathToField
   * @param {*} oldValue
   */
  $$handleValueChangeByUser(pathToField, oldValue) {
    var value = this.$storage.getFieldValue(pathToField);
    var eventData = {
      fieldName: pathToField,
      oldValue,
      value: value,
    };

    if (this.$onChangeCallback) this.$onChangeCallback({[pathToField]: value});

    // Rise events
    events.emit('change', eventData);
    events.emit(`field.${pathToField}.change`, eventData);
  }

  $$handleInitialValueChange(pathToField, newInitialValue) {
    this.$formState.setFieldInitialValue(pathToField, newInitialValue);
  }

  $$handleFieldStateChange(stateName, newValue) {
    this.$formState.setStateValue(stateName, newValue);
  }

  $$handleAnyFieldsValidStateChange(pathToField, isValid, invalidMsg) {
    var newInvalidMessages = {...this.invalidMsg};
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

  $getWholeStorageState() {
    return this.$storage.getWhoreStorageState();
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    // TODO: add data
    events.emit('anyChange');
    events.emit(`field.${pathToField}.anyChange`);
  }

}
