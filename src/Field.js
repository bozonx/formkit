const _ = require('lodash');
const DebouncedCall = require('./DebouncedCall');
const { calculateDirty, getFieldName, isPromise } = require('./helpers');


module.exports = class Field {
  constructor(pathToField, params, form, fieldStorage) {
    this._form = form;
    this._fieldStorage = fieldStorage;
    this._debouncedCall = new DebouncedCall(this._form.config.debounceTime);
    if (!_.isUndefined(params.debounceTime)) this.setDebounceTime(params.debounceTime);

    this._pathToField = pathToField;
    this._fieldName = getFieldName(pathToField);
    this._handlers = {
      onChange: undefined,
      onSave: undefined,
    };

    this._initState(params);

    this.handleChange = this.handleChange.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handlePressEnter = this.handlePressEnter.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
    this._doSave = this._doSave.bind(this);
    this._afterSaveEnd = this._afterSaveEnd.bind(this);
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
   * Current value
   * @return {*}
   */
  get value() {
    return this._fieldStorage.getCombinedValue(this._pathToField);
  }
  get name() {
    return this._fieldName;
  }
  get path() {
    return this._pathToField;
  }
  get dirty() {
    return this._fieldStorage.getState(this._pathToField, 'dirty');
  }
  get touched() {
    return this._fieldStorage.getState(this._pathToField, 'touched');
  }
  get valid() {
    return this._fieldStorage.getState(this._pathToField, 'valid');
  }
  get invalidMsg() {
    return this._fieldStorage.getState(this._pathToField, 'invalidMsg');
  }
  get saving() {
    return this._fieldStorage.getState(this._pathToField, 'saving');
  }
  get savable() {
    return !this.canSave();
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
  get debounceTime() {
    return this._debouncedCall.delay;
  }

  /**
   * Check for field can be saved.
   * @return {string|undefined} - undefined means it can. Otherwise it returns a reason.
   */
  canSave() {
    // don't save invalid value
    if (!this.valid) return 'Field is invalid';

    // save only value which was modified.
    if (!this._fieldStorage.isFieldUnsaved(this._pathToField)) {
      return `Value hasn't modified`;
    }
  }

  /**
   * Set value silently(don't rise a change event).
   * It does:
   * * It set a new value to self instance and to storage
   * * It updates "dirty" and "valid" states.
   * * It rises storageChange event.
   *
   * It doesn't:
   * * It doesn't rise onChange callback (for user's events).
   * * It doesn't update "touched" state.
   * @param newValue
   */
  setValue(newValue) {
    // set top value layer
    // TODO: установить значений и dirty silently а только потом поднять одно событие
    this._fieldStorage.setState(this._pathToField, { editedValue: newValue });
    this.$recalcDirty();
    this.form.validate();
  }

  /**
   * Set previously saved value. Usually it sets after server data has loading.
   * @param {*} newSavedValue
   */
  setSavedValue(newSavedValue) {
    // TODO: test
    // set saved value
    this._setState({ savedValue: newSavedValue });

    // TODO: лучше устанавливать в любом случае, а вот очищать state level только если поле не под фокусом

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (this._form.config.allowFocusedFieldUpdating || (!this._form.config.allowFocusedFieldUpdating && !this.focused)) {
      // TODO: может лучше удалить верхний уровень???
      //this.setValue(newSavedValue);

      this._setState({ editedValue: undefined });
    }

    // TODO: событе поднять отдельно чтобы не дублировалось
  }

  setDisabled(value) {
    if (!_.isBoolean(value)) throw new Error(`Disabled has to be boolean`);
    this._setState({ disabled: value });
  }

  setDebounceTime(delay) {
    const toNumber = _.toNumber(delay);
    if (_.isNull(toNumber) || _.isNaN(toNumber)) throw new Error(`Bad debounceTime value`);
    // TODO: doesn't work
    this._debouncedCall.delay = toNumber;
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
   * * Run an onChange callback if it assigned.
   * * Start saving
   * @param {*} newValue
   */
  handleChange(newValue) {
    // don't do anything if disabled
    if (this.disabled) return;

    // value is immutable
    const oldValue = this.value;
    const isChanged = !_.isEqual(oldValue, newValue);

    if (isChanged) {
      // set editedValue, dirty state and validate
      this.setValue(newValue);

      // set touched to true
      if (!this.touched) {
        this._setState({ touched: true });
        this._form.$setState({ touched: true });
      }
    }

    // rise change event and save only changed value
    if (!this._form.config.allowSaveUnmodifiedField && !isChanged) return;

    // rise change by user event handlers and callbacks of form and field
    this._riseUserChangeEvent(this._pathToField, oldValue, newValue);
    // start save with debounced delay
    this._addSavingToQueue(false);
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
    // start save immediately
    this.save();
  }

  /**
   * bind it to your component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handlePressEnter() {
    if (this.disabled) return;
    // start save immediately
    this.save();
  }

  /**
   * Add one or more handlers on fields's event:
   * * change
   * * silentChange
   * * anyChange
   * * saveStart
   * * saveEnd
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    this._fieldStorage.on(this._pathToField, eventName, cb);
  }

  off(eventName, cb) {
    this._fieldStorage.off(this._pathToField, eventName, cb);
  }

  /**
   * It rises a callback on field's value changes which has made by user.
   * @param {function} handler - callback. You can set only one callback per field.
   */
  onChange(handler) {
    this._handlers.onChange = handler;
  }

  /**
   * It rises with debounce delay on start saving.
   * @param {function} handler - callback. If it returns a promise - saving process will wait for it.
   *                             You can set only one callback per field.
   */
  onSave(handler) {
    this._handlers.onSave = handler;
  }

  /**
   * Start saving of field's value immediately.
   * @return {Promise}
   */
  save() {
    return this._addSavingToQueue(true);
  }

  /**
   * Clear value(user input) and set initial value.
   */
  clear() {
    // TODO: test
    const initial = this._fieldStorage.getState(this._pathToField, 'initial');
    this.setValue(initial);
  }

  /**
   * set saved value to current value.
   */
  revert() {
    // TODO: test
    this.setValue(this.savedValue);
  }

  /**
   * Reset to default value
   */
  reset() {
    this.setValue(this.defaultValue);
  }

  /**
   * Cancel debounce waiting for saving
   */
  cancelSaving() {
    this._debouncedCall.cancel();
  }

  /**
   * Saving immediately
   */
  flushSaving() {
    this._debouncedCall.flush();
  }

  /**
   * It calls from form after validating.
   * @param {string|undefined} invalidMsg - invalid message of undefined
   */
  $setValidState(invalidMsg) {
    this._setState({
      valid: _.isUndefined(invalidMsg),
      invalidMsg,
    });
  }

  /**
   * Recalculate dirty state.
   */
  $recalcDirty() {
    // TODO: review
    const newDirtyValue =  calculateDirty(this.value, this.savedValue);

    // set to field
    this._setState({ dirty: newDirtyValue });
  }

  _setState(partlyState) {
    this._fieldStorage.setState(this._pathToField, partlyState);
  }

  /**
   * Init field state.
   * @param {object} params - params which was passed to form init.
   * @private
   */
  _initState(params) {
    const initialState = _.omitBy({
      disabled: params.disabled,
      defaultValue: params.defaultValue,
      initial: params.initial,
    }, _.isUndefined);
    // set initial value otherwise default value
    const newValue = (_.isUndefined(params.initial)) ? params.defaultValue : params.initial;

    // init state
    this._fieldStorage.initState(this._pathToField, initialState);

    if (!_.isUndefined(newValue)) {
      // set to edited layer
      this._fieldStorage.setState(this._pathToField, { editedValue: newValue });
      this.form.validate();
    }
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
      fieldName: pathToField,
      oldValue,
      value: newValue,
      event: 'change',
    };

    // call field's onChange handler
    const fieldOnChangeHandler = this._handlers.onChange;
    if (fieldOnChangeHandler) fieldOnChangeHandler(eventData);
    // call forms's onChange handler
    this._form.$callHandler('onChange', { [pathToField]: newValue });

    // Rise events field's change handler
    this._fieldStorage.emit(pathToField, 'change', eventData);
    // run form's change handler
    this._form.$emit('change', { [pathToField]: newValue });
  }

  /**
   * Start saving field and form if they have a corresponding handlers.
   * @param {boolean} isImmediately
   *   * if true it will save immediately.
   *   * if false it will save with debounce delay
   * @private
   * @return {Promise} - promise of saving process or just resolve if field isn't savable.
   */
  _addSavingToQueue(isImmediately) {

    // TODO: проверить логику - должно либо встать в очередь либо отменить текущее сохранение
    /*
     * If "force" param is true it will cancel current saving process before start a new one.
     * If "force" param is false it add this saving process to queue.
     */

    // do nothing if field isn't savable
    if (!this.savable) return Promise.resolve();

    // do save after debounce
    return this._debouncedCall.exec(this._doSave, isImmediately);
  }

  /**
   * Do field saving process.
   * * set "saving" state to true
   * * rise "saveStart" event
   * * call "save" callback. If it returns a promise - wait for it
   * and after saving ends:
   * * set "saving" state to false
   * * rise "saveEnd" event
   * @return {Promise|undefined} - if "save" callback returns promise this method returns it.
   * @private
   */
  _doSave() {
    // value is immutable
    const data = this.value;

    // set saving: true
    this._setState({ saving: true });
    // rise saveStart event
    this._fieldStorage.emit(this._pathToField, 'saveStart', data);
    this._form.$emit('saveStart', { path: this._pathToField, data });

    if (this._handlers.onSave) {
      // run save callback
      const cbPromise = this._handlers.onSave(data);

      if (isPromise(cbPromise)) {
        return cbPromise
          .then(this._afterSaveEnd)
          .catch((error) => {
            this._afterSaveEnd({ error });

            return Promise.reject(error);
          });
      }
    }

    // if save callback hasn't returned a promise
    // or if there isn't a save callback
    this._afterSaveEnd();
  }

  _afterSaveEnd(result) {
    // set saving: false
    this._setState({ saving: false });
    // rise saveEnd
    this._fieldStorage.emit(this._pathToField, 'saveEnd', result);

    this._form.$emit('saveEnd', {
      path: this._pathToField,
      result,
      isSuccess: !(result && result.error),
    });
  }

};
