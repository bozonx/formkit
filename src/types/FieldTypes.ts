export interface FieldState {
  defaultValue?: any
  dirty?: boolean
  disabled?: boolean
  editedValue?: any
  focused?: boolean
  initial?: any
  invalidMsg?: string
  touched?: boolean
  savedValue?: any
  saving?: boolean
  value?: any
  prevValue?: any

  // TODO: зачем не обязательные ???

}

export enum FieldEvent {
  change,
  storage,
  saveStart,
  saveEnd,
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
//export type FieldState = keyof typeof FIELD_STATE
