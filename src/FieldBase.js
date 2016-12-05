import _ from 'lodash';

import FieldState from './FieldState';

export default class FieldBase {
  constructor(form, fieldName) {
    this.$form = form;
    this.$pathToField = fieldName;
    this.__debounceTime = this.$form.$config.debounceTime;
    this.$fieldState = new FieldState(this.$form, this, this.$pathToField);
    this.$onChangeCallback = null;
    this.__onSaveCallback = null;

    this._debouncedCb = _.debounce((cb) => cb(), this.__debounceTime);
  }

  __startSave(force) {
    // don't save invalid value
    if (!this.$fieldState.getState('valid')) return;

    if (force) {
      // cancelling
      this._debouncedCb.cancel();
      // save without debounce
      if (this.__onSaveCallback) this.__onSaveCallback(this.$fieldState.getValue());
    }
    else {
      this._debouncedCb(() => {
        if (this.__onSaveCallback) this.__onSaveCallback(this.$fieldState.getValue())
      });
    }

    this.$form.$handlers.handleFieldSave(force);
  }

  __updateDirty() {
    var value = this.$fieldState.getValue();
    var initialValue = this.$fieldState.getInitialValue();
    var newValue;

    if (value === '' && (initialValue === '' || _.isNil(initialValue))) {
      // 0 compares as common value.
      newValue = false;
    }
    else {
      // just compare initial value and value
      newValue = value !== initialValue;
    }

    this.$fieldState.setStateValue('dirty', newValue);
    this.$form.$handlers.handleFieldStateChange('dirty', newValue);
  }

}
