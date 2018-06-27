import FieldState from './FieldState';
import {FieldEventName} from '../FieldStorage';


interface EventFieldState extends FieldState {
  value: any;
  prevValue: any;
}


export default interface FieldEventData {
  target: 'field';
  // TODO: use 'storage'
  event: FieldEventName;
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
