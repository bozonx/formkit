import _ from 'lodash';

export default class FormState {
  constructor() {
    this.state = {
      values: {},
      initialValues: {},
      dirty: null,
      touched: null,
      valid: null,
      focusedField: null,
      submitting: null,
    };
  }

  getValues() {
    return _.cloneDeep(this.state.values);
  }

  setFieldValue(fieldName, newValue) {
    this.state.values[fieldName] = newValue;
  }

  setValues(values) {
    // TODO: нужно deep extend
    _.extend(this.state.values, values);
  }

  // setInitialValues(initialValues) {
  //   // TODO: нужно deep extend
  //   _.extend(this.state.initialValues, initialValues);
  //   // _.each(fieldsList, (fieldName) => {
  //   //   this.state.values[fieldName] = null;
  //   // });
  // }

  setState(newState) {
    _.extend(this.state, newState);
  }


}
