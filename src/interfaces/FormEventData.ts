import FormState from './FormState';

export default interface FormEventData {
  action: string;
  target: string;
  event: string;
  state: FormState;
  oldState: FormState;
  error?: Error;
}
