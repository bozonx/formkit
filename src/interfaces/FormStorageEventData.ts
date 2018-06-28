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
  // TODO: новый стейт не нужен, его и так можно получить
  state: EventFormState;
  prevState: EventFormState;
  error?: Error;
}
