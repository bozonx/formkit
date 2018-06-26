import FieldState from './FieldState';
import {FieldEventName} from '../FieldStorage';


export default interface FieldEventData {
  target: 'field';
  event: FieldEventName;
  // current state
  state: FieldState;
  // previous state
  prevState: FieldState;
  oldValue: any;
  value: any;
  error?: Error;

  // path to field
  field: string;
}
