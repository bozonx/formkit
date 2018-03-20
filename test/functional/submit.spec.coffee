formHelper = require('../../src/index')


describe.only 'Functional. Submit.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

  it 'simple submit', ->
    submitHandler = sinon.spy();
    this.form.onSubmit(submitHandler)

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()
    expect(submitHandler).to.have.been.calledOnce
    expect(submitHandler).to.have.been.calledWith({name: 'newValue'})
    assert.isFalse(this.form.submitting)

  it 'submitting with promise', ->
    submitHandler = () ->
      return new Promise (resolve) =>
        resolve()

    this.form.onSubmit(submitHandler)

    this.form.fields.name.handleChange('newValue')

    handleSubmitReturn = this.form.handleSubmit()
    assert.isTrue(this.form.submitting)

    handleSubmitReturn.then () =>
      assert.isFalse(this.form.submitting)

  it 'rejected promise', ->
    submitHandler = ->
      new Promise (resolve, reject) =>
        reject(new Error('error'))

    this.form.onSubmit(submitHandler)

    this.form.fields.name.handleChange('newValue')

    handleSubmitReturn = this.form.handleSubmit()

    assert.isTrue(this.form.submitting)
    expect(handleSubmitReturn).to.eventually.rejected

    handleSubmitReturn.catch =>
      assert.isFalse(this.form.submitting)

  it "don't submit while form is submitting at the moment.", ->
    promiseResolve = null;
    savedData = null
    submitHandler = (values) =>
      savedData = values
      new Promise (resolve) =>
        promiseResolve = resolve
    this.form.onSubmit(submitHandler)

    this.form.fields.name.handleChange('newValue')
    firstSubmit = this.form.handleSubmit()
    assert.isTrue(this.form.submitting)

    # run second time
    this.form.fields.name.handleChange('newValue2')
    secondSubmit = this.form.handleSubmit()
    assert.isTrue(this.form.submitting)

    promiseResolve()

    expect(secondSubmit).to.eventually.rejected

    firstSubmit.then =>
      assert.isFalse(this.form.submitting)
      assert.deepEqual(savedData, { name: 'newValue' })

  it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: false", ->
    submitHandler = sinon.spy();
    this.form.onSubmit(submitHandler)

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()

    expect(submitHandler).to.have.been.calledOnce
    expect(submitHandler).to.have.been.calledWith({name: 'newValue'})
    assert.equal(this.form.submitting, false)

  it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: true", ->
    submitHandler = sinon.spy();
    this.form.onSubmit(submitHandler)
    this.form.config.allowSubmitUnchangedForm = true

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()

    expect(submitHandler).to.have.been.calledTwice

  it "disallow submit invalid form", ->
    submitHandler = sinon.spy();
    this.form.onSubmit(submitHandler)
    this.form.setValidateCb((errors) -> errors.name = 'invalid' )

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()

    expect(submitHandler).to.have.not.been.called
    assert.equal(this.form.submitting, false)

  it "run submit without submit callback", ->
    this.form.fields.name.handleChange('newValue')

    assert.deepEqual(this.form.unsavedValues, { name: 'newValue' })
    assert.isTrue(this.form.dirty)
    this.form.handleSubmit()

    assert.equal(this.form.submitting, false)
    assert.deepEqual(this.form.unsavedValues, {})
    assert.isFalse(this.form.dirty)

  it "check updated unsaved values. config.allowUpdateSavedValuesAfterSubmit: true", ->
    this.form.fields.name.setSavedValue('savedValue')
    this.form.fields.name.handleChange('newValue')

    assert.deepEqual(this.form.fields.name.savedValue, 'savedValue')
    assert.deepEqual(this.form.savedValues, { name: 'savedValue' })
    assert.isTrue(this.form.dirty)
    this.form.handleSubmit()

    assert.equal(this.form.submitting, false)
    assert.equal(this.form.fields.name.savedValue, 'newValue')
    assert.deepEqual(this.form.savedValues, { name: 'newValue' })
    assert.isFalse(this.form.dirty)

  it "don't update saved values after submit. config.allowUpdateSavedValuesAfterSubmit: false", ->
    this.form.config.allowUpdateSavedValuesAfterSubmit = false
    this.form.fields.name.setSavedValue('savedValue')
    this.form.fields.name.handleChange('newValue')

    assert.deepEqual(this.form.fields.name.savedValue, 'savedValue')
    assert.deepEqual(this.form.savedValues, { name: 'savedValue' })
    assert.isTrue(this.form.dirty)
    this.form.handleSubmit()

    assert.equal(this.form.submitting, false)
    assert.equal(this.form.fields.name.savedValue, 'savedValue')
    assert.deepEqual(this.form.savedValues, { name: 'savedValue' })
    assert.isTrue(this.form.dirty)
