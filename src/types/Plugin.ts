import type {Form} from '../Form.js'


export interface Plugin {
  afterNewFormCreated: (newForm: Form) => void
}
