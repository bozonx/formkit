import _ from 'lodash';

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
      // TODO: брать значение по умолчанию из конфига
      debounceTime: 1000,
      //disabled: null,
      //checked: null,
      //placeholder: null,
      //focused: null,
    };
  }

  getFormState() {
    return _.cloneDeep(this.$store.formState);
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
   * @param stateName
   * @param newValue
   */
  setFieldState(pathToField, stateName, newValue) {
    _.set(this.$store, `fieldsState.${pathToField}.${stateName}`, newValue);
  }
}
