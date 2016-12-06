import _ from 'lodash';

export default class FormHandlers {
  constructor(form) {
    this.$onChangeCallback = null;
    this.$onSaveCallback = null;

    this._form = form;
    this._unsavedState = {};
    this._debouncedCb = _.debounce((cb) => cb(), this._form.$config.debounceTime);
  }

  /**
   * It calls form field on debounced save handler.
   * @param {boolean} force
   */
  handleFieldSave(force) {
    if (!this.$onSaveCallback) return;

    //console.log(11111, force)


    if (force) {
      // cancelling
      this._debouncedCb.cancel();
      // save without debounce
      this.$onSaveCallback(this._unsavedState);
      this._unsavedState = {};
    }
    else {
      this._debouncedCb(() => {
        // save current state on the moment
        this.$onSaveCallback(this._unsavedState);
        this._unsavedState = {};
      });
    }
  }

  /**
   * It calls from field on silent value change.
   * It means - it calls on any value change.
   * It rises a "silentChange" event.
   * It rises on any value change by user or by program.
   * @param {string} pathToField
   * @param {*} oldValue
   */
  handleSilentValueChange(pathToField, oldValue) {
    var eventData = {
      fieldName: pathToField,
      oldValue,
      value: this._form.$storage.getFieldValue(pathToField),
    };

    // It hopes actual value is in storage at the moment
    this._form.$updateValues(this._form.$storage.getFieldsValues());

    // Rise events
    this._form.$events.emit('silentChange', eventData);
    this._form.$events.emit(`field.${pathToField}.silentChange`, eventData);

    // TODO: ну только отсюда должно подниматься событие
    this._riseAnyChange(pathToField);
  }

  /**
   * It calls form field on value changed by user
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @param {string} pathToField
   * @param {*} oldValue
   * @param {*} newValue
   */
  handleValueChangeByUser(pathToField, oldValue, newValue) {
    var value = this._form.$storage.getFieldValue(pathToField);
    var eventData = {
      fieldName: pathToField,
      oldValue,
      value: value,
    };

    if (this.$onChangeCallback) this.$onChangeCallback({[pathToField]: value});

    // Rise events
    this._form.$events.emit('change', eventData);
    this._form.$events.emit(`field.${pathToField}.change`, eventData);

    _.set(this._unsavedState, pathToField, newValue);
  }

  handleInitialValueChange(pathToField, newInitialValue) {
    this._form.$formState.setFieldInitialValue(pathToField, newInitialValue);
  }

  handleFieldStateChange(stateName, newValue) {
    this._form.$formState.setStateValue(stateName, newValue);
  }

  handleAnyFieldsValidStateChange(pathToField, isValid, invalidMsg) {
    var newInvalidMessages = {...this.invalidMsg};
    if (isValid) {
      delete newInvalidMessages[pathToField];
    }
    else {
      newInvalidMessages[pathToField] = invalidMsg;
    }

    this._form.$formState.setStateValue('invalidMsg', newInvalidMessages);

    var isFormValid = _.isEmpty(newInvalidMessages);
    this._form.$formState.setStateValue('valid', isFormValid);
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    // TODO: add data
    this._form.$events.emit('anyChange');
    this._form.$events.emit(`field.${pathToField}.anyChange`);
  }

}
