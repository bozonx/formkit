formHelper = require('../../src/index').default

describe 'Functional. Submit.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})
    this.submitHandler = sinon.spy();
    this.form.onSubmit(this.submitHandler)

  it '', ->
    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()
    expect(this.submitHandler).to.have.been.calledOnce
    expect(this.submitHandler).to.have.been.calledWith({name: 'newValue'})
