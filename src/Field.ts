import * as _ from 'lodash';
import { calculateDirty, getFieldName, parseValue } from './helpers/helpers';


/**
 * Field. It represent form field.
 */
export default class Field {
  constructor(pathToField, params, form, fieldStorage) {
    this._form = form;
    this._fieldStorage = fieldStorage;
    this._pathToField = pathToField;
    this._fieldName = getFieldName(pathToField);
    if (!_.isUndefined(params.debounceTime)) this.setDebounceTime(params.debounceTime);

    this._initState(params);

    this.handleChange = this.handleChange.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleEndEditing = this.handleEndEditing.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
  }

  get form() {
    return this._form;
  }
  get savedValue() {
    return this._fieldStorage.getState(this._pathToField, 'savedValue');
  }
  get editedValue() {
    return this._fieldStorage.getState(this._pathToField, 'editedValue');
  }

  /**
   * Combined value
   * @return {*}
   */
  get value() {
    return this._fieldStorage.getCombinedValue(this._pathToField);
  }
  get name() {
    return this._fieldName;
  }
  get fullName() {
    return this._pathToField;
  }
  get dirty() {
    return this._fieldStorage.getState(this._pathToField, 'dirty');
  }
  get touched() {
    return this._fieldStorage.getState(this._pathToField, 'touched');
  }
  get valid() {
    return !this._fieldStorage.getState(this._pathToField, 'invalidMsg');
  }
  get invalidMsg() {
    return this._fieldStorage.getState(this._pathToField, 'invalidMsg');
  }
  get saving() {
    return this._fieldStorage.getState(this._pathToField, 'saving');
  }
  get focused() {
    return this._fieldStorage.getState(this._pathToField, 'focused');
  }
  get disabled() {
    return this._fieldStorage.getState(this._pathToField, 'disabled');
  }
  get defaultValue() {
    return this._fieldStorage.getState(this._pathToField, 'defaultValue');
  }


  /**
   * Set value silently(don't rise a change event).
   * It does:
   * * It set a new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises storageChange event.
   *
   * It doesn't:
   * * It doesn't rise change event.
   * * It doesn't update "touched" state.
   * @param {*} rawValue - new value to set
   */
  setValue(rawValue) {
    this._updateStateAndValidate(() => {
      const newValue = parseValue(rawValue);
      this.$setEditedValueSilent(newValue);
    });
  }

  /**
   * Set previously saved value. Usually it sets after server data has loading.
   * @param {*} rawValue - new value to set
   */
  setSavedValue(rawValue) {
    this._updateStateAndValidate(() => {
      const newSavedValue = parseValue(rawValue);
      this.$setSavedValue(newSavedValue);
    });
  }

  setDisabled(value) {
    if (!_.isBoolean(value)) throw new Error(`Disabled has to be boolean`);
    this._setState({ disabled: value });
  }

  /**
   * It's an onChange handler. It has to be placed to input's onChange attribute.
   * It sets a new value made by user and start saving.
   * It does:
   * * don't do anything if field is disabled
   * * don't save if value isn't changed
   * * update value
   * * update "touched" and "dirty" states
   * * validate form
   * * Rise a "change" events for field and form
   * * Start saving
   * @param {*} rawValue
   */
  handleChange(rawValue) {
    // don't do anything if disabled
    if (this.disabled) return;

    const newValue = parseValue(rawValue);
    // value is immutable
    const oldValue = this.value;
    const isChanged = !_.isEqual(oldValue, newValue);

    if (isChanged) {
      // it rises a storage event
      this._updateState(() => {
        // set editedValue and dirty state
        this.$setEditedValueSilent(newValue);
        this.form.validate();

        // set touched to true
        if (!this.touched) {
          this.$setStateSilent({ touched: true });
          this._form.$setStateSilent({ touched: true });
        }
      });
    }

    // rise change event and save only changed value
    if (!this._form.config.allowSaveUnmodifiedField && !isChanged) return;

    // rise change by user event handlers and callbacks of form and field
    this._riseUserChangeEvent(this._pathToField, oldValue, newValue);
  }

  /**
   * Set field's "focused" prop to true.
   */
  handleFocusIn() {
    this._setState({ focused: true });
  }

  /**
   * Set field's "focused" prop to false.
   */
  handleBlur() {
    this._setState({ focused: false });
    this._form.flushSaving();
  }

  /**
   * bind it to your component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handleEndEditing() {
    if (this.disabled) return;
    this._form.flushSaving();
  }

  /**
   * Add one or more handlers on fields's event:
   * * change
   * * storage
   * * saveStart
   * * saveEnd
   * @param {string} eventName - name of field's event
   * @param {function} cb - Event handler
   */
  on(eventName, cb) {
    this._fieldStorage.on(this._pathToField, eventName, cb);
  }

  off(eventName, cb) {
    this._fieldStorage.off(this._pathToField, eventName, cb);
  }

  /**
   * Clear value(user input) and set initial value.
   */
  clear() {
    this._updateStateAndValidate(() => {
      this.$clearSilent();
    });
  }

  /**
   * set saved value to current value.
   */
  revert() {
    this._updateStateAndValidate(() => {
      this.$revertSilent();
    });
  }

  /**
   * Reset to default value
   */
  reset() {
    this._updateStateAndValidate(() => {
      this.$resetSilent();
    });
  }

  $clearSilent() {
    const initial = this._fieldStorage.getState(this._pathToField, 'initial');
    this.$setEditedValueSilent(initial);
  }

  $revertSilent() {
    this.$setEditedValueSilent(this.savedValue);
  }

  $resetSilent() {
    this.$setEditedValueSilent(this.defaultValue);
  }

  $destroyHandlers() {
    this._handlers = {};
  }

  $setEditedValueSilent(newValue) {
    // set top value layer
    this.$setStateSilent({
      editedValue: newValue,
      dirty: calculateDirty(newValue, this.savedValue),
    });
  }

  $setSavedValue(newSavedValue) {
    const newState = {
      savedValue: newSavedValue,
      editedValue: this.editedValue,
    };

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this._form.config.allowFocusedFieldUpdating || (!this._form.config.allowFocusedFieldUpdating && !this.focused)) {
      // clear top level
      newState.editedValue = undefined;
    }

    newState.dirty = calculateDirty(newState.editedValue, newState.savedValue);

    this.$setStateSilent(newState);
  }

  $setStateSilent(newPartlyState) {
    this._fieldStorage.setStateSilent(this._pathToField, newPartlyState);
  }

  $setValueAfterSave(savedValue) {
    // if value hasn't changed after submit was started - clear it
    if (savedValue === this.value) {
      this._fieldStorage.setStateSilent(this._pathToField, { editedValue: undefined });
    }

    // in any way set to saved layer
    this._fieldStorage.setStateSilent(this._pathToField, {
      savedValue,
      dirty: calculateDirty(this.editedValue, savedValue),
    });
  }

  /**
   * Init field's state.
   * @param {object} params - params which was passed to form init.
   * @private
   */
  _initState({ initial, disabled, defaultValue, savedValue }) {
    const parsedInitial = parseValue(initial);
    const parsedDefaultValue = parseValue(defaultValue);

    // set initial value otherwise default value
    const newValue = (_.isUndefined(parsedInitial)) ? parsedDefaultValue : parsedInitial;
    const initialState = _.omitBy({
      disabled,
      defaultValue: parsedDefaultValue,
      initial: parsedInitial,
      // set initial value to edited layer
      editedValue: (_.isUndefined(newValue)) ? undefined : newValue,
      savedValue,
    }, _.isUndefined);

    // init state
    this._fieldStorage.initState(this._pathToField, initialState);
  }

  /**
   * It calls form field on value changed by user
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @param {string} pathToField
   * @param {*} oldValue
   * @param {*} newValue
   */
  _riseUserChangeEvent(pathToField, oldValue, newValue) {
    const eventData = {
      field: pathToField,
      oldValue,
      value: newValue,
      event: 'change',
    };

    // Rise events field's change handler
    this._fieldStorage.emit(pathToField, 'change', eventData);
    // call forms's change handler - it rises change callback and start saving
    this._form.$handleFieldChange(eventData);
  }

  _setState(partlyState) {
    this._updateState(() => {
      this._fieldStorage.setStateSilent(this._pathToField, partlyState);
    });
  }

  _updateStateAndValidate(cbWhichChangesState) {
    this._updateState(() => {
      if (cbWhichChangesState) cbWhichChangesState();
      this.form.validate();
    });
  }

  _updateState(cbWhichChangesState) {
    const oldState = this._fieldStorage.getWholeState(this._pathToField);

    if (cbWhichChangesState) cbWhichChangesState();

    const newState = this._fieldStorage.getWholeState(this._pathToField);
    this._fieldStorage.emitStorageEvent(this._pathToField, 'update', newState, oldState);
  }

}
