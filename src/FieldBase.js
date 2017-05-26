import _ from 'lodash';

import DebouncedCall from './DebouncedCall';

export default class FieldBase {
  constructor(form, fieldName) {
    // TODO: protected props rename to __prop
    this.$form = form;
    this.$pathToField = fieldName;
    this.$onChangeCallback = null;
    this.__storage = this.$form.$storage;
    this.__onSaveCallback = null;
    this.__debouncedCall = new DebouncedCall(this.$form.$config.debounceTime);

    this._debouncedCb = undefined;
    this._validateCb = undefined;

    // init state
    // TODO: !!!! this.$pathToField и fieldName = одно и то же
    this.__storage.initFieldState(this.$pathToField, fieldName);
  }

  get form() {
    return this.$form;
  }
  // TODO: ?? может тоже переименовать в inputValue
  get userInput() {
    return this.__storage.getUserInput(this.$pathToField);
  }
  // TODO: переименовать в fixedValue / savedValue / prevStateValue
  get outerValue() {
    return this.__storage.getOuterValue(this.$pathToField);
  }
  // combined value
  get value() {
    return this.__storage.getValue(this.$pathToField);
  }
  get name() {
    return this.__storage.getFieldState(this.$pathToField, 'name');
  }
  get dirty() {
    return this.__storage.getFieldState(this.$pathToField, 'dirty');
  }
  get touched() {
    return this.__storage.getFieldState(this.$pathToField, 'touched');
  }
  get valid() {
    return this.__storage.getFieldState(this.$pathToField, 'valid');
  }
  get invalidMsg() {
    return this.__storage.getFieldState(this.$pathToField, 'invalidMsg');
  }
  get saving() {
    return this.__storage.getFieldState(this.$pathToField, 'saving');
  }
  get focused() {
    return this.__storage.getFieldState(this.$pathToField, 'focused');
  }
  get disabled() {
    return this.__storage.getFieldState(this.$pathToField, 'disabled');
  }
  get validateCb() {
    return this._validateCb;
  }
  get debounceTime() {
    return this.__debouncedCall.delay;
  }

  // set outer value with clearing user input
  setValue(newOuterValue) {
    // TODO: может переименовать в setFixedValue?
    // TODO: !!!! WTF??!!
    this._hardlySetOuterValue(newOuterValue);
  }
  setDisabled(value) {
    this.__storage.setFieldState(this.$pathToField, { disabled: value });
  }
  setValidateCb(value) {
    this._validateCb = value;
  }
  setDebounceTime(delay) {
    this.__debouncedCall.delay = delay;
  }


  // TODO: WTF??? наверное это setFixedValueSilent ???
  $setOuterValue(newValue) {
    this.__storage.setOuterValue(this.$pathToField, newValue);
  }

  /**
   * Recalculate dirty state.
   */
  $recalcDirty() {
    let newDirtyValue;

    if (this.userInput === '' && (this.outerValue === '' || _.isNil(this.outerValue))) {
      // 0 compares as common value.
      newDirtyValue = false;
    }
    else {
      // just compare initial value and value
      newDirtyValue = this.userInput !== this.outerValue;
    }

    this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, newDirtyValue);
  }

  /**
   * Start saving field and form in they have a save handlers.
   * It will reset saving in progress before start saving.
   * @param {boolean} force
   *   * if true it will save immediately.
   *   * if false it will save with dobounce delay
   * @private
   */
  __startSave(force) {
    // don't save invalid value
    if (!this.valid) return;
    // TODO: ??? for what???
    // don't save already saved value
    if (!this.$form.$handlers.isUnsaved(this.$pathToField)) return;

    // rise a field's save callback
    if (this.__onSaveCallback) {
      // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
      // TODO: должно подняться собитие save этого поля
      this.__debouncedCall.exec(this.__onSaveCallback, force, this.value);
    }
    // TODO: может надо сначала сбросить текущее сохранение если оно идёт?
    // TODO: должно подняться собитие save формы
    // rise form's save callback
    this.$form.$handlers.handleFieldSave(force);
  }

  /**
   * Silent update. It uses for set outer(from machine) values (not user's).
   *
   * It does:
   * * It set up new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises anyChange event for field and whole form.
   *
   * It doesn't:
   * * It doesn't rise onChange callback (for user's events).
   * * It doesn't update "touched" state.
   * @param {*} newValue
   */
  _hardlySetOuterValue(newValue) {
    // TODO: !!!! rename
    // TODO: !!!! review

    const oldCombinedValue = _.cloneDeep(this.value);

    // set to outer value layer
    this.$setOuterValue(newValue);

    // remove user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this.$form.$config.allowFocusedFieldUpdating || (!this.$form.$config.allowFocusedFieldUpdating && !this.focused)) {
      this.__storage.setUserInput(this.$pathToField, undefined);
      this.$form.$handlers.handleFieldDirtyChange(this.$pathToField, false);
    }

    // re validate and rise events
    if (!_.isEqual(oldCombinedValue, this.value)) {
      this.validate();
      // rise silent change events
      this.$form.$handlers.handleSilentValueChange(this.$pathToField, oldCombinedValue);
    }
  }

}
