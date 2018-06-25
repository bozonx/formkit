import FormState from './FormState';

export default interface FormEventData {
  action: string;
  target: string;
  event: string;
  state: FormState;
  oldState: FormState;
  error?: Error;

  // TODO: values, editedValues
  // TODO: review - наверное наследовать от базового интерфейса

}
