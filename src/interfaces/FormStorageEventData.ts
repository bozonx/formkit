import FormState from './FormState';
import {FormEventName} from '../FormStorage';


export default interface FormStorageEventData {
  target: 'form';
  event: FormEventName;
  state: FormState;
  prevState: FormState;
  error?: Error;

  // TODO: values, editedValues
}
