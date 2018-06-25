export default interface FieldEventData {
  // TODO: use one of
  action: string;
  field: string;
  target: 'field';
  // TODO: use one of
  event: string;
  oldValue: any;
  value: any;
  //error?: Error;

  // TODO: state, oldState
}
