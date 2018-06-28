import FieldState from '../FieldState';


export default interface FieldStorageEventData {
  // path to field
  field: string;

  // TODO: почему бы событие не назвать fieldStorage
  target: 'field';
  // TODO: ??? Why ???
  event: 'storage';
  // TODO: новый стейт не нужен, его и так можно получить
  // current state
  state: FieldState;
  // previous state
  prevState?: FieldState;
  // prevValue: any;
  // value: any;
  error?: Error;
}
