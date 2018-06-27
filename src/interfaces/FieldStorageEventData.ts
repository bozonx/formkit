import FieldState from './FieldState';
import {FieldEventName} from '../FieldStorage';


interface EventFieldState extends FieldState {
  value: any;
  prevValue: any;
}


export default interface FieldStorageEventData {
  // TODO: почему бы событие не назвать fieldStorage
  target: 'field';
  event: 'storage';
  // current state
  state: EventFieldState;
  // previous state
  prevState: EventFieldState;
  // oldValue: any;
  // value: any;
  error?: Error;

  // path to field
  field: string;
}
