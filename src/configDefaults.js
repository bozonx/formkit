module.exports = {
  silent: false,
  debounceTime: 800,

  /**
   * If true - it runs change event and starts saving callback and rise saving events even field's value doesn't change.
   * If false - it disallows run change event and start saving if value doesn't change.
   */
  allowUnchanged: false,

  allowFocusedFieldUpdating: false,

  /**
   * Allow run submit even the form hasn't changed.
   */
  allowSubmitUnchangedForm: false,

  updateSavedValuesAfterSubmit: true,
};
