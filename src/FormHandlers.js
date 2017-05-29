import _ from 'lodash';

import DebouncedCall from './DebouncedCall';

export default class FormHandlers {
  constructor(form) {
    this.$onChangeCallback = null;
    this.$onSaveCallback = null;

    this._form = form;
    // TODO: почему здесь хранятся unsaved - наверное надо в Storage?
    this._unsavedState = {};

    this.$debouncedCall = new DebouncedCall(this._form.$config.debounceTime);
  }

  // TODO: наверное надо в field перенести???
  isUnsaved(pathToField) {
    return _.has(this._unsavedState, pathToField);
  }

  /**
   * It calls form field on debounced save handler.
   * @param {boolean} force
   */
  handleFieldSave(force) {
    if (!this.$onSaveCallback) return;

    this.$debouncedCall.exec(() => {
      // save current state on the moment
      this.$onSaveCallback(this._unsavedState);
      this._unsavedState = {};
    }, force);
  }

  /**
   * It calls from field on silent value change (after outer value setting).
   * It means - it calls onlu on value changes by machine.
   * It rises a "silentChange" and "anyChange" events.
   * @param {string} pathToField
   * @param {*} oldCombinedValue
   */
  handleSilentValueChange(pathToField, oldCombinedValue) {
    const eventData = {
      fieldName: pathToField,
      oldValue: oldCombinedValue,
      value: this._form.$storage.getValue(pathToField),
    };

    // Rise events
    this._form.$events.emit('silentChange', eventData);
    this._form.$events.emit(`field.${pathToField}.silentChange`, eventData);

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
    const eventData = {
      fieldName: pathToField,
      oldValue,
      value: newValue,
    };

    // run form's on change callback
    if (this.$onChangeCallback) this.$onChangeCallback({ [pathToField]: newValue });

    // Rise events
    this._form.$events.emit('change', eventData);
    this._form.$events.emit(`field.${pathToField}.change`, eventData);

    _.set(this._unsavedState, pathToField, newValue);

    this._riseAnyChange(pathToField);
  }

  handleFieldStateChange(pathToField, stateName, newValue) {
    this._form.$storage.setFieldState(pathToField, { touched: true });
    this._form.$storage.setFormState(stateName, newValue);
  }

  handleFieldDirtyChange(pathToField, newDirtyValue) {
    this._form.$storage.setFieldState(pathToField, { dirty: newDirtyValue });

    if (newDirtyValue) {
      this._form.$storage.setFormState('dirty', true);
    }
    else {
      // search for other dirty values in other fields
      const hasAnyDirty = this._form.$storage.findRecursively('fieldsState', (field) => {
        if (field.dirty) return true;
      });

      this._form.$storage.setFormState('dirty', !!hasAnyDirty);
    }
  }


  handleFieldValidStateChange(pathToField, isValid, invalidMsg) {
    // TODO: review
    this._form.$storage.setFieldState(pathToField, { valid: isValid });
    this._form.$storage.setFieldState(pathToField, { invalidMsg });

    const newInvalidMessages = _.clone(this._form.invalidMsgList);
    if (isValid) {
      _.find(newInvalidMessages, (item, index) => {
        if (!_.isUndefined(item[pathToField])) {
          const deleteCount = 1;
          newInvalidMessages.splice(index, deleteCount);

          return item;
        }
      });
    }
    else {
      newInvalidMessages.push({ [pathToField]: invalidMsg });
    }

    const isFormValid = _.isEmpty(newInvalidMessages);

    this._form.$storage.setFormState('invalidMsgList', newInvalidMessages);
    this._form.$storage.setFormState('valid', isFormValid);
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    this._form.$events.emit('anyChange');
    this._form.$events.emit(`field.${pathToField}.anyChange`);
  }

}
