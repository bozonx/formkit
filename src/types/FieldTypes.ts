
export enum FieldEvent {
  change,
  storage,
  saveStart,
  saveEnd,
}

export interface FieldState {
  defaultValue: any
  dirty: boolean
  disabled: boolean
  editedValue: any
  focused: boolean
  initial: any
  invalidMsg?: string
  touched: boolean
  savedValue: any
  saving: boolean
  value: any
  prevValue: any
  // field label
  label: string
  // hint message
  hint: string
  //success message
  success: string
  placeholder: string
  // any custom data for field
  custom: Record<string, any>
}

export const FIELD_STATE = {
  defaultValue: 'defaultValue',
  dirty: 'dirty',
  disabled: 'disabled',
  editedValue: 'editedValue',
  focused: 'focused',
  initial: 'initial',
  invalidMsg: 'invalidMsg',
  touched: 'touched',
  savedValue: 'savedValue',
  saving: 'saving',
  value: 'value',
  prevValue: 'prevValue',
}
