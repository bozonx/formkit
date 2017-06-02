import { findInFieldRecursively } from './helpers';

/**
 * It sets field and form states and rise an event if need
 * @class
 */
export default class State {
  constructor(form, storage) {
    this._form = form;
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
    this._storage.setFieldState(pathToField, { dirty: newDirtyValue });

    if (newDirtyValue) {
      this._storage.setFormState('dirty', true);
    }
    else {
      // TODO: ??? может лучше ничего не делать???
      // search for other dirty values in other fields
      const hasAnyDirty = this._storage.findRecursively('fieldsState', (field) => {
        if (field.dirty) return true;
      });

      this._storage.setFormState('dirty', !!hasAnyDirty);
    }
  }

  setFieldAndFormValidState(pathToField, isValid, invalidMsg) {
    this._storage.setFieldState(pathToField, {
      valid: isValid,
      invalidMsg,
    });

    const hasAnyErrors = !!findInFieldRecursively(this._form.fields, (field) => {
      if (!field.valid) return true;
    });

    this._storage.setFormState('valid', !hasAnyErrors);
  }

}
