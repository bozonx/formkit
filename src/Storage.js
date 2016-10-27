import _ from 'lodash';
import { extendDeep } from './helpers';

export default class Storage {
  constructor() {
    this.$store = {
      formState: {},
      // name: value or parent.name: value
      fieldsValue: {},
      fieldsInitialValue: {},
      fieldsState: {},
    };
  }

  generateNewFormState() {
    return {
      initialValues: {},
      dirty: false,
      touched: false,
      submitting: false,
      valid: true,
      invalidMsg: '',
    };
  }

  generateNewFieldState(name) {
    return {
      name: name,
      value: null,
      // It uses only for compare value with initialValue. Don't use it for binding.
      initialValue: null,
      dirty: false,
      touched: false,
      valid: true,
      invalidMsg: null,
      validateRule: null,
      saving: false,
      //disabled: null,
      //placeholder: null,
      //focused: null,
    };
  }

  getWhoreStorageState() {
    return _.cloneDeep(this.$store);
  }

  getFormState() {
    return _.cloneDeep(this.$store.formState);
  }

  getFieldValue(pathToField) {
    return _.cloneDeep(_.get(this.$store.fieldsValue, pathToField));
  }

  getFieldInitialValue(pathToField) {
    return _.cloneDeep(_.get(this.$store.fieldsInitialValue, pathToField));
  }

  getFieldState(pathToField, stateName) {
    return _.cloneDeep(_.get(this.$store.fieldsState, `${pathToField}.${stateName}`));
  }

  getFieldsValues() {
    return _.cloneDeep(this.$store.fieldsValue);
  }

  getFieldsInitialValues() {
    return _.cloneDeep(this.$store.fieldsInitialValue);
  }

  /**
   * Set form's state. Only primitive, not container or array
   * @param stateName
   * @param newValue
   */
  setFormState(stateName, newValue) {
    _.set(this.$store, `formState.${stateName}`, newValue);
  }

  /**
   * Set field's value - primitive not container or array
   * @param pathToField
   * @param newValue
   */
  setFieldValue(pathToField, newValue) {
    _.set(this.$store, `fieldsValue.${pathToField}`, newValue);
  }

  /**
   * Set field's value - primitive not container or array
   * @param pathToField
   * @param newValue
   */
  setFieldInitialValue(pathToField, newValue) {
    _.set(this.$store, `fieldsInitialValue.${pathToField}`, newValue);
  }

  /**
   * Set field's state - primitive value, not container or array
   * @param pathToField
   * @param newState
   */
  setFieldState(pathToField, newState) {
    //_.set(this.$store, `fieldsState.${pathToField}.${stateName}`, newValue);
    if (_.isUndefined(this.$store.fieldsState[pathToField])) {
      this.$store.fieldsState[pathToField] = {};
    }
    extendDeep(this.$store.fieldsState[pathToField], newState);
  }
}
