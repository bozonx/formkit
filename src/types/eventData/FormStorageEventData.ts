import type {FormState} from '../FormState.js'
import type {Values} from '../../FormStorage.js'


interface EventFormState extends FormState {
  values: Values
  prevValues: Values
}


export interface FormStorageEventData {
  // TODO: почему бы событие не назвать formStorage
  target: 'form'
  // TODO: ??? Why ???
  event: 'storage'
  // TODO: новый стейт не нужен, его и так можно получить
  state: EventFormState
  prevState: EventFormState
  error?: Error
}
