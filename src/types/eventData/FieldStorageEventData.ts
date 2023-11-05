import type {FieldTypes} from '../FieldTypes.js'


export interface FieldStorageEventData {
  // path to field
  field: string

  // TODO: почему бы событие не назвать fieldStorage
  target: 'field'
  // TODO: ??? Why ???
  event: 'storage'
  // TODO: новый стейт не нужен, его и так можно получить
  // current state
  state: FieldTypes
  // previous state
  prevState?: FieldTypes
  // prevValue: any;
  // value: any;
  error?: Error
}
