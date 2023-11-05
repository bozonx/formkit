import type {Values} from '../../FormStorage.js'
import type {FormEvent} from '../FormTypes.js';


interface EventFormState extends FormTypes {
  values: Values
  prevValues: Values
}


export interface FormStorageEventData {
  // TODO: почему бы событие не назвать formStorage
  target: 'form'
  // TODO: ??? Why ???
  event: FormEvent
  // TODO: новый стейт не нужен, его и так можно получить
  state: EventFormState
  prevState: EventFormState
  error?: Error
}
