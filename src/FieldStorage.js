const _ = require('lodash');
const { extendDeep, findFieldLikeStructureRecursively } = require('./helpers');


module.exports = class FieldStorage {
  constructor(storage) {
    this._storage = storage;
  }


  setFieldSavingState(pathToField, value) {
    this._storage.setFieldState(pathToField, { saving: value });
  }

  setFieldAndFormTouched(pathToField) {
    this._storage.setFieldState(pathToField, { touched: true });
    this._storage.setFormState('touched', true);
  }

  setFieldAndFormDirty(pathToField, newDirtyValue) {
    // set to field
    this._storage.setFieldState(pathToField, { dirty: newDirtyValue });

    // set to form
    if (newDirtyValue) {
      // if field is dirty it means the form is dirty too
      this._storage.setFormState('dirty', true);
    }
    else {
      // if field not dirty - calculate form's dirty state
      // search for other dirty values in other fields
      const hasAnyDirty = this._storage.findFieldStateRecursively('fieldsState', (field) => {
        if (field.dirty) return true;
      });

      this._storage.setFormState('dirty', !!hasAnyDirty);
    }
  }


  addFieldListener(pathToField, eventName, cb) {
    this._eventEmitter.addListener(`field.${pathToField}.${eventName}`, cb);
  }

  riseFieldEvent(pathToField, eventName, data) {
    this._eventEmitter.emit(`field.${pathToField}.${eventName}`, data);
  }


  /**
   * It calls from field on silent value change (after outer value setting).
   * It means - it calls onlu on value changes by machine.
   * It rises a "silentChange" and "anyChange" events.
   * @param {string} pathToField
   * @param {*} oldValue
   */
  riseSilentChangeEvent(pathToField, oldValue) {
    const eventData = {
      fieldName: pathToField,
      oldValue,
      value: this.getValue(pathToField),
    };

    // Rise events
    this.riseFieldEvent(pathToField, 'silentChange', eventData);
    this._riseFormEvent('silentChange', eventData);
    this.riseAnyChange(pathToField);
  }

  /**
   * It calls form field on value changed by user
   * It rises a "change" event.
   * It rises only if value changed by user.
   * @param {string} pathToField
   * @param {*} oldValue
   * @param {*} newValue
   */
  riseUserChangeEvent(pathToField, oldValue, newValue) {
    const eventData = {
      fieldName: pathToField,
      oldValue,
      value: newValue,
    };

    // run field's cb
    if (this._fieldsCallbacks[pathToField] && this._fieldsCallbacks[pathToField].change) {
      this._fieldsCallbacks[pathToField].change(eventData);
    }
    // run forms's cb
    if (this._formCallbacks.change) {
      this._formCallbacks.change({ [pathToField]: newValue });
    }

    // Rise events field's change handler
    this.riseFieldEvent(pathToField, 'change', eventData);
    // run form's change handler
    this._riseFormEvent('change', { [pathToField]: newValue });
    this.riseAnyChange(pathToField);
  }


  getFieldCallback(pathToField, eventName) {
    if (!this._fieldsCallbacks[pathToField]) return;

    return this._fieldsCallbacks[pathToField][eventName];
  }

  // setFormCallback(eventName, cb) {
  //   this._formCallbacks[eventName] = cb;
  // }

  setFieldCallback(pathToField, eventName, cb) {
    if (!this._fieldsCallbacks[pathToField]) {
      this._fieldsCallbacks[pathToField] = {
        change: null,
        save: null,
      };
    }

    this._fieldsCallbacks[pathToField][eventName] = cb;
  }

  setMeta(pathToField, eventName) {
    // TODO: set meta
    // TODO: rise anyChange
  }

  getCallBack(cbName) {
    // TODO:
  }

  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  riseAnyChange(pathToField) {
    this.riseFieldEvent(pathToField, 'anyChange');
    this._riseFormEvent('anyChange');
  }

  _riseFormEvent(eventName, data) {
    this._eventEmitter.emit(`form.${eventName}`, data);
  }



  initFieldState(pathToField) {
    // TODO: review
    this.setFieldState(pathToField, this._generateNewFieldState(pathToField));
  }

  /**
   * get current value
   * @param pathToField
   * @return {*}
   */
  getValue(pathToField) {
    return _.cloneDeep(_.get(this._storage.$store().values, pathToField));
  }

  getState(pathToField, stateName) {
    return _.cloneDeep(_.get(this._storage.$store().fieldsState, `${pathToField}.${stateName}`));
  }

  isFieldUnsaved(pathToField) {
    return _.get(this._storage.$store().fieldsState, pathToField).savedValue !== _.get(this._storage.$store().values, pathToField);
  }

  setAllSavedValues(submittedValues) {
    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field, path) => {
      field.savedValue = _.get(submittedValues, path);
    });
  }

  setValue(pathToField, newValue) {
    _.set(this._storage.$store().values, pathToField, newValue);
  }

  // TODO: rename
  /**
   * Set field's state.
   * @param pathToField
   * @param newState
   */
  setFieldState(pathToField, newState) {
    // TODO: review стратегию обновления
    let field = _.get(this._storage.$store().fieldsState, pathToField);
    if (_.isUndefined(field)) {
      field = {};
      _.set(this._storage.$store().fieldsState, pathToField, field);
    }
    // TODO: review
    extendDeep(field, newState);
  }

  // TODO: rename
  findFieldStateRecursively(root, cb) {
    return findFieldLikeStructureRecursively(this._storage.$store()[root], cb);
  }

  _generateNewFieldState() {
    return {
      dirty: false,
      touched: false,
      valid: true,
      invalidMsg: undefined,
      validCombined: true,
      saving: false,
      disabled: false,
      focused: false,
      defaultValue: undefined,
      savedValue: undefined,
    };
  }

};
