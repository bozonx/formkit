export interface ChangeEventData {
  // path to field
  field: string
  value: any
  prevValue: any
  error?: Error
}
