import type {Values} from '../FormStorage.js'

// export interface FormState {
//   touched?: boolean
//   submitting?: boolean
//   saving?: boolean
//   valid?: boolean
//   values?: Values
//   prevValues?: Values
//
//   // TODO: зачем не обязательные ???
//
// }

export enum FormEvent {
  change,
  storage,
  saveStart,
  saveEnd,
  submitStart,
  submitEnd,
}

export const FORM_STATE = {
  touched: 'touched',
  submitting: 'submitting',
  saving: 'saving',
  valid: 'valid',
  values: 'values',
  prevValues: 'prevValues',
}
export type FormState = keyof typeof FORM_STATE
