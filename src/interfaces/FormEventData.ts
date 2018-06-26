import FormState from './FormState';
import {FormEventName} from '../FormStorage';


export default interface FormEventData {
  // TODO: зачем это нужно ???
  action: 'update' | 'init';
  target: 'form';
  event: FormEventName;
  state: FormState;
  prevState: FormState;
  error?: Error;

  // TODO: values, editedValues
}
