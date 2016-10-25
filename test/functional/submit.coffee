formHelper = require('../../src/index').default

describe 'Functional. Submit.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})

  it 'simple submit', ->
    this.submitHandler = sinon.spy();
    this.form.onSubmit(this.submitHandler)

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()
    expect(this.submitHandler).to.have.been.calledOnce
    expect(this.submitHandler).to.have.been.calledWith({name: 'newValue'})
    assert.equal(this.form.submitting, false)

  it 'submitting with promise', (done) ->
    this.submitHandler = () ->
      return new Promise (resolve) =>
        resolve()

    this.form.onSubmit(this.submitHandler)

    this.form.fields.name.handleChange('newValue')

    handleSubmitReturn = this.form.handleSubmit()
    assert.equal(this.form.submitting, true)

    expect(handleSubmitReturn).to.eventually.notify =>
      assert.equal(this.form.submitting, false)
      done()
