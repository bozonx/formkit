import _ from 'lodash';

import FieldState from './FieldState';

export default class FieldBase {
  constructor(form, fieldName) {
    this.$form = form;
    this.$fieldName = fieldName;
    this.$fieldState = new FieldState(this.$form, this, this.$fieldName);

    this.$onChangeCallback = null;
    this.$onSaveCallback = null;
    //this._onAnyChangeCallback = null;

    // TODO: приватное
    this.debounceTime = 1000;

    this._debouncedCb = _.debounce((cb, value) => {
      cb(value);
    }, this.debounceTime);
  }

  _startSave(force) {
    // don't save invalid value
    if (!this.$fieldState.getState('valid')) return;

    if (force) {
      if (this.$onSaveCallback) this.$onSaveCallback(this.$fieldState.getValue());
      // cancelling
      this._debouncedCb.cancel();
    }
    else {
      if (this.$onSaveCallback) this._debouncedCb(this.$onSaveCallback, this.$fieldState.getValue());
    }
  }

  _updateDirty() {
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
    this.$form.$$handleAnyFieldsStateChange('dirty', newValue);
  }

}
