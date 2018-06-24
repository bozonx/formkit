import FormState from './FormState';

export default interface FromEventData {
  action: string;
  target: string;
  event: string;
  state: FormState;
  oldState: FormState;
}
