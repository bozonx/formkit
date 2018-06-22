import Form from '../Form';


export default interface Plugin {
  afterNewFormCreated: (newForm: Form) => void
}
