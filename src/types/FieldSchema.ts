export interface FieldSchema {
  initial: any
  disabled: boolean
  defaultValue: any
  savedValue: any
  editedValue?: any
  debounceTime: number

  // field label
  label: string
  // hint message
  hint?: string
  //success message
  success?: string
  placeholder?: string
  // any custom data for field
  custom?: Record<string, any>
}
