const _ = require('lodash');
const { findFieldLikeStructureRecursively } = require('./helpers');


module.exports = class FieldStorage {
  constructor(storage) {
    this._storage = storage;
  }

  initState(pathToField, initialState) {
    const newState = {
      ...this._storage.generateNewFieldState(),
      ...initialState,
    };

    _.set(this._storage.$store().fieldsState, pathToField, newState);
  }


  /**
   * get current value
   * @param pathToField
   * @return {*}
   */
  getValue(pathToField) {
    return this._storage.getValue(pathToField);
  }

  getState(pathToField, stateName) {
    return this._storage.getState(pathToField, stateName);
  }


  /**
   * Set state value to field.
   * Field has to be initialized previously.
   * It rises an "anyChange" event of field
   * @param pathToField
   * @param partlyState
   */
  setState(pathToField, partlyState) {
    this._storage.setFieldState(pathToField, partlyState);
    // TODO: rise storageChange - только если значение изменилось
  }

  setValue(pathToField, newValue) {
    this._storage.setValue(pathToField, newValue);
    // TODO: rise storageChange - только если значение изменилось
  }

  getCallBack(pathToField, eventName) {
    if (!this._fieldsCallbacks[pathToField]) return;

    return this._fieldsCallbacks[pathToField][eventName];
  }

  addFieldListener(pathToField, eventName, cb) {
    this._storage.events.addListener(`field.${pathToField}.${eventName}`, cb);
  }

  riseFieldEvent(pathToField, eventName, data) {
    this._storage.events.emit(`field.${pathToField}.${eventName}`, data);
  }


  // /**
  //  * It calls from field on silent value change (after outer value setting).
  //  * It means - it calls onlu on value changes by machine.
  //  * It rises a "silentChange" and "anyChange" events.
  //  * @param {string} pathToField
  //  * @param {*} oldValue
  //  */
  // riseSilentChangeEvent(pathToField, oldValue) {
  //   // TODO: remove
  //   const eventData = {
  //     fieldName: pathToField,
  //     oldValue,
  //     value: this.getValue(pathToField),
  //     type: 'silentChange',
  //   };
  //
  //   // Rise events
  //   this.riseFieldEvent(pathToField, 'silentChange', eventData);
  //   this._riseFormEvent('silentChange', eventData);
  //   this.riseAnyChange(pathToField);
  // }




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



  /**
   * It rises a "stateChange" event.
   * It rises on any change of value, initialValue or any state.
   * @private
   */
  _riseAnyChange(pathToField) {
    this.riseFieldEvent(pathToField, 'anyChange');
    this._riseFormEvent('anyChange');
  }

  _riseFormEvent(eventName, data) {
    this._eventEmitter.emit(`form.${eventName}`, data);
  }




  isFieldUnsaved(pathToField) {
    return _.get(this._storage.$store().fieldsState, pathToField).savedValue !== _.get(this._storage.$store().values, pathToField);
  }

  setAllSavedValues(submittedValues) {
    findFieldLikeStructureRecursively(this._storage.$store().fieldsState, (field, path) => {
      field.savedValue = _.get(submittedValues, path);
    });
  }



  // TODO: rename
  findFieldStateRecursively(root, cb) {
    return findFieldLikeStructureRecursively(this._storage.$store()[root], cb);
  }


  setFieldAndFormDirty(pathToField, newDirtyValue) {
    // TODO: review
    // set to field
    this._storage.setState(pathToField, { dirty: newDirtyValue });

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



};
