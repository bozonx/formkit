module.exports = {
  silent: false,
  debounceTime: 800,

  /**
   * If true - it starts saving callback and rise saving events even field's value doesn't change.
   * If false - it disallow start saving if value doesn't change, but handle change has run.
   */
  allowSaveUnchanged: false,

  allowFocusedFieldUpdating: false,
  allowSubmitSubmittingForm: false,
  allowSubmitUnchangedForm: false,
  updateSavedValuesAfterSubmit: true,
};
