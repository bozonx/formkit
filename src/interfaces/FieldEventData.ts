import FieldState from './FieldState';
import {FieldEventName} from '../FieldStorage';


export default interface FieldEventData {
  // TODO: зачем это нужно ???
  action: 'update' | 'init';
  // path to field
  field: string;
  target: 'field';
  event: FieldEventName;
  oldValue: any;
  value: any;
  // current state
  state: FieldState;
  // previous state
  prevState: FieldState;
  error?: Error;
}
