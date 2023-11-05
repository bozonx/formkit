import type {Values} from '../FormStorage.js'

export interface FormState {
  touched?: boolean
  submitting?: boolean
  saving?: boolean
  valid?: boolean
  values?: Values
  prevValues?: Values

  // TODO: зачем не обязательные ???

}
