import type {Values} from './types.js';


export enum FormEvent {
  change,
  storage,
  saveStart,
  saveEnd,
  submitStart,
  submitEnd,
}

export interface FormState {
  touched: boolean
  submitting: boolean
  saving: boolean
  valid: boolean
  values: Values
  prevValues: Values
}

export const FORM_STATE = {
  touched: 'touched',
  submitting: 'submitting',
  saving: 'saving',
  valid: 'valid',
  values: 'values',
  prevValues: 'prevValues',
}
