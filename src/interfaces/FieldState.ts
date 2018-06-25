export default interface FieldState {
  defaultValue?: any;
  dirty?: boolean;
  disabled?: boolean;
  editedValue?: any;
  focused?: boolean;
  initial?: any;
  invalidMsg?: string;
  touched?: boolean;
  savedValue?: any;
  saving?: boolean;

  // TODO: зачем не обязательные ???

}
