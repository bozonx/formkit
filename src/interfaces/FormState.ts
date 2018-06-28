import {Values} from '../FormStorage';

export default interface FormState {
  touched?: boolean;
  submitting?: boolean;
  saving?: boolean;
  valid?: boolean;
  values?: Values;
  prevValues?: Values;

  // TODO: зачем не обязательные ???

}
