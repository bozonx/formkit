import * as _ from 'lodash';
import { calculateDirty, getFieldName, parseValue } from './helpers/helpers';
import Form from './Form';
import FieldSchema from './interfaces/FieldSchema';
import FieldStorage, {FieldEventName} from './FieldStorage';
import FieldEventData from './interfaces/FieldEventData';
import FieldState from './interfaces/FieldState';


/**
 * Field. It represent form field.
 */
export default class Field {
  private readonly form: Form;
  private readonly fieldStorage: FieldStorage;
  private readonly pathToField: string;
  private readonly fieldName: string;

  constructor(pathToField: string, params: FieldSchema, form: Form) {
    this.form = form;
    this.fieldStorage = this.form.fieldStorage;
    this.pathToField = pathToField;
    this.fieldName = getFieldName(pathToField);
    // TODO: ????
    //if (!_.isUndefined(params.debounceTime)) this.setDebounceTime(params.debounceTime);

    this.initState(params);
  }

  get savedValue(): any {
    return this.fieldStorage.getState(this.pathToField, 'savedValue');
  }
  get editedValue(): any {
    return this.fieldStorage.getState(this.pathToField, 'editedValue');
  }

  /**
   * Combined value
   */
  get value(): any {
    return this.fieldStorage.getCombinedValue(this.pathToField);
  }
  get name(): string {
    return this.fieldName;
  }
  get fullName(): string {
    return this.pathToField;
  }
  get dirty(): boolean {
    return this.fieldStorage.getState(this.pathToField, 'dirty');
  }
  get touched(): boolean {
    return this.fieldStorage.getState(this.pathToField, 'touched');
  }
  get valid(): boolean {
    return !this.fieldStorage.getState(this.pathToField, 'invalidMsg');
  }
  get invalidMsg(): string {
    return this.fieldStorage.getState(this.pathToField, 'invalidMsg');
  }
  get saving(): boolean {
    return this.fieldStorage.getState(this.pathToField, 'saving');
  }
  get focused(): boolean {
    return this.fieldStorage.getState(this.pathToField, 'focused');
  }
  get disabled(): boolean {
    return this.fieldStorage.getState(this.pathToField, 'disabled');
  }
  get defaultValue(): any {
    return this.fieldStorage.getState(this.pathToField, 'defaultValue');
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
  setValue(rawValue: any): void {
    this.updateStateAndValidate(() => {
      const newValue: any = parseValue(rawValue);

      this.$setEditedValueSilent(newValue);
    });
  }

  /**
   * Set previously saved value. Usually it sets after server data has loading.
   * @param {*} rawValue - new value to set
   */
  setSavedValue(rawValue: any): void {
    this.updateStateAndValidate(() => {
      const newSavedValue: any = parseValue(rawValue);

      this.$setSavedValue(newSavedValue);
    });
  }

  setDisabled(disabled: boolean): void {
    this.setState({ disabled });
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
  handleChange = (rawValue: any): void => {
    // don't do anything if disabled
    if (this.disabled) return;

    const newValue = parseValue(rawValue);
    // value is immutable
    const oldValue = this.value;
    const isChanged: boolean = !_.isEqual(oldValue, newValue);

    if (isChanged) {
      // it rises a storage event
      this.updateState(() => {
        // set editedValue and dirty state
        this.$setEditedValueSilent(newValue);
        this.form.validate();

        // set touched to true of field and form
        if (!this.touched) {
          this.$setStateSilent({ touched: true });
          this.form.$setStateSilent({ touched: true });
        }
      });
    }

    // rise change event and save only if value has changed
    if (!this.form.config.allowSaveUnmodifiedField && !isChanged) return;

    // rise change by user event handlers and callbacks of form and field
    this.riseUserChangeEvent(this.pathToField, oldValue, newValue);
  }

  /**
   * Set field's "focused" prop to true.
   */
  handleFocusIn = (): void => {
    this.setState({ focused: true });
  }

  /**
   * Set field's "focused" prop to false.
   */
  handleBlur = (): void => {
    this.setState({ focused: false });
    this.form.flushSaving();
  }

  /**
   * bind it to your component to onEnter event.
   * It does:
   * * cancel previous save in queue
   * * immediately starts save
   */
  handleEndEditing = (): void => {
    if (this.disabled) return;
    this.form.flushSaving();
  }

  /**
   * Add one or more handlers on fields's event:
   */
  on(eventName: FieldEventName, cb: (data: FieldEventData) => void): void {
    this.fieldStorage.on(this.pathToField, eventName, cb);
  }

  off(eventName: FieldEventName, cb: (data: FieldEventData) => void): void {
    this.fieldStorage.off(this.pathToField, eventName, cb);
  }

  /**
   * Clear value(user input) and set initial value.
   */
  clear = (): void => {
    this.updateStateAndValidate(() => {
      this.$clearSilent();
    });
  }

  /**
   * set saved value to current value.
   */
  revert = (): void => {
    this.updateStateAndValidate(() => {
      this.$revertSilent();
    });
  }

  /**
   * Reset to default value
   */
  reset = (): void => {
    this.updateStateAndValidate(() => {
      this.$resetSilent();
    });
  }

  $clearSilent(): void {
    const initial = this.fieldStorage.getState(this.pathToField, 'initial');
    this.$setEditedValueSilent(initial);
  }

  $revertSilent(): void {
    this.$setEditedValueSilent(this.savedValue);
  }

  $resetSilent(): void {
    this.$setEditedValueSilent(this.defaultValue);
  }

  $destroyHandlers(): void {

    // TODO: do it !!!!

    //this._handlers = {};
  }

  $setEditedValueSilent(newValue: any): void {
    // set top value layer
    this.$setStateSilent({
      editedValue: newValue,
      dirty: calculateDirty(newValue, this.savedValue),
    });
  }

  $setSavedValue(newSavedValue: any): void {
    const newState: FieldState = {
      savedValue: newSavedValue,
      editedValue: this.editedValue,
    };

    // update user input if field isn't on focus and set dirty to false.
    // of course if it allows in config.
    if (
      this.form.config.allowFocusedFieldUpdating
      || (!this.form.config.allowFocusedFieldUpdating
      && !this.focused)
    ) {
      // clear top level
      newState.editedValue = undefined;
    }

    newState.dirty = calculateDirty(newState.editedValue, newState.savedValue);

    this.$setStateSilent(newState);
  }

  $setStateSilent(newPartlyState: FieldState): void {
    this.fieldStorage.setStateSilent(this.pathToField, newPartlyState);
  }

  $setValueAfterSave(savedValue: any): void {
    // if value hasn't changed after submit was started - clear it
    if (savedValue === this.value) {
      this.fieldStorage.setStateSilent(this.pathToField, { editedValue: undefined });
    }

    // in any way set to saved layer
    this.fieldStorage.setStateSilent(this.pathToField, {
      savedValue,
      dirty: calculateDirty(this.editedValue, savedValue),
    });
  }


  /**
   * Init field's state.
   */
  private initState(rawFieldSchema: FieldSchema): void {
    const initialState: FieldSchema = this.generateInitialState(rawFieldSchema);

    // init state
    this.fieldStorage.initState(this.pathToField, initialState);
  }

  private generateInitialState({ initial, disabled, defaultValue, savedValue }: FieldSchema): FieldSchema {
    const parsedInitial = parseValue(initial);
    const parsedDefaultValue = parseValue(defaultValue);

    // set initial value otherwise default value
    const newValue = (typeof parsedInitial === 'undefined') ? parsedDefaultValue : parsedInitial;

    // TODO: зачем нужно omitBy ???
    return _.omitBy({
      disabled,
      defaultValue: parsedDefaultValue,
      initial: parsedInitial,
      // set initial value to edited layer
      editedValue: (typeof newValue === 'undefined') ? undefined : newValue,
      savedValue,
    }, _.isUndefined);
  }

  /**
   * It calls form field on value changed by user
   * It rises a "change" event.
   * It rises only if value changed by user.
   */
  private riseUserChangeEvent(pathToField: string, oldValue: any, newValue: any) {
    const eventData: FieldEventData = {
      field: pathToField,
      oldValue,
      value: newValue,
      event: 'change',
    };

    // Rise events field's change handler
    this.fieldStorage.emit(pathToField, 'change', eventData);
    // call forms's change handler - it rises change callback and start saving

    // TODO: !!!!??? надо преобразовать
    this.form.$handleFieldChange(eventData);
  }

  private setState(partlyState: FieldState): void {
    this.updateState(() => {
      this.fieldStorage.setStateSilent(this.pathToField, partlyState);
    });
  }

  private updateStateAndValidate(cbWhichChangesState?: () => void): void {
    this.updateState(() => {
      if (cbWhichChangesState) cbWhichChangesState();
      this.form.validate();
    });
  }

  private updateState(cbWhichChangesState: () => void): void {
    const prevState = this.fieldStorage.getWholeState(this.pathToField);

    if (cbWhichChangesState) cbWhichChangesState();

    const newState = this.fieldStorage.getWholeState(this.pathToField);
    this.fieldStorage.emitStorageEvent(this.pathToField, 'update', newState, prevState);
  }

}
