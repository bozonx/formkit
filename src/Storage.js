import _ from 'lodash';

export default class Storage {
  constructor() {
    this.$storage = {
      formState: {
        initialValues: {},
        dirty: false,
        touched: false,
        submitting: false,
        valid: true,
        invalidMsg: '',
      },
      // name: value or parent.name: value
      fieldsValue: {},
      fieldsInitialValue: {},
      fieldsState: {},
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
    return _.cloneDeep(this.$storage.formState);
  }

  getFieldsValues() {
    return _.cloneDeep(this.$storage.fieldsValue);
  }

  getFieldsInitialValues() {
    return _.cloneDeep(this.$storage.fieldsInitialValue);
  }

  /**
   * Set form's state. Only primitive, not container or array
   * @param path
   * @param newValue
   */
  setFormState(path, newValue) {
    _.set(this.$storage, `formState.${path}`, newValue);
  }

  /**
   * Set field's value - primitive not container or array
   * @param path
   * @param newValue
   */
  setFieldValue(path, newValue) {
    _.set(this.$storage, `fieldsValue.${path}`, newValue);
  }

  /**
   * Set field's value - primitive not container or array
   * @param path
   * @param newValue
   */
  setFieldInitialValue(path, newValue) {
    _.set(this.$storage, `fieldsInitialValue.${path}`, newValue);
  }

  /**
   * Set field's state - primitive value, not container or array
   * @param pathToField
   * @param stateName
   * @param newValue
   */
  setFieldState(pathToField, stateName, newValue) {
    _.set(this.$storage, `fieldsState.${pathToField}.${stateName}`, newValue);
  }
}


