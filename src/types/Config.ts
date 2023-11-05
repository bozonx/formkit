export interface Config {
  /**
   * Delay time after field changing
   */
  debounceTime?: number
  /**
   * Allow/disallow start saving if field doesn't change.
   * If true - it saving even field's value doesn't change.
   * If false - it disallows start saving if value doesn't change.
   */
  allowSaveUnmodifiedField: boolean

  /**
   * Allow/disallow update focused field after setting value from server.
   */
  allowFocusedFieldUpdating: boolean

  /**
   * Allow/disallow run submit even the form hasn't changed.
   */
  allowSubmitUnchangedForm: boolean
}
