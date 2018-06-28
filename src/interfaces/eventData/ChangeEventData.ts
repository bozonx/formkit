export default interface ChangeEventData {
  // TODO: ??? Why ???
  event: 'change';
  value: any;
  prevValue: any;
  error?: Error;
  // path to field
  field: string;
}
