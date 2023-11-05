import type {FormEvent, FormState} from '../FormTypes.js'
import type {Values} from '../types.js'


interface EventFormState extends FormState {
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
