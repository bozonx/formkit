import FormState from './FormState';
import {Values} from '../FormStorage';


interface EventFormState extends FormState {
  values: Values;
  prevValues: Values;
}


export default interface FormStorageEventData {
  // TODO: почему бы событие не назвать formStorage
  target: 'form';
  event: 'storage';
  state: EventFormState;
  prevState: EventFormState;
  error?: Error;
}
