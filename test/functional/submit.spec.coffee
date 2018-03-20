formHelper = require('../../src/index')


describe 'Functional. Submit.', ->
  beforeEach () ->
    @form = formHelper.newForm()
    @form.init(['name'])

  it 'simple submit', ->
    submitHandler = sinon.spy();
    @form.onSubmit(submitHandler)

    @form.fields.name.handleChange('newValue')
    @form.handleSubmit()
    sinon.assert.calledOnce(submitHandler)
    sinon.assert.calledWith(submitHandler, { name: 'newValue' })
    assert.isFalse(@form.submitting)

  it 'submitting with promise', ->
    submitHandler = () ->
      return new Promise (resolve) =>
        resolve()

    @form.onSubmit(submitHandler)

    @form.fields.name.handleChange('newValue')

    handleSubmitReturn = @form.handleSubmit()
    assert.isTrue(@form.submitting)

    handleSubmitReturn.then () =>
      assert.isFalse(@form.submitting)

  it 'rejected promise', ->
    submitHandler = ->
      new Promise (resolve, reject) =>
        reject(new Error('error'))

    @form.onSubmit(submitHandler)

    @form.fields.name.handleChange('newValue')

    handleSubmitReturn = @form.handleSubmit()

    assert.isTrue(@form.submitting)
    expect(handleSubmitReturn).to.eventually.rejected

    handleSubmitReturn.catch =>
      assert.isFalse(@form.submitting)

  it "don't submit while form is submitting at the moment.", ->
    promiseResolve = null;
    savedData = null
    submitHandler = (values) =>
      savedData = values
      new Promise (resolve) =>
        promiseResolve = resolve
    @form.onSubmit(submitHandler)

    @form.fields.name.handleChange('newValue')
    firstSubmit = @form.handleSubmit()
    assert.isTrue(@form.submitting)

    # run second time
    @form.fields.name.handleChange('newValue2')
    secondSubmit = @form.handleSubmit()
    assert.isTrue(@form.submitting)

    promiseResolve()

    expect(secondSubmit).to.eventually.rejected

    firstSubmit.then =>
      assert.isFalse(@form.submitting)
      assert.deepEqual(savedData, { name: 'newValue' })

  it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: false", ->
    submitHandler = sinon.spy();
    @form.onSubmit(submitHandler)

    @form.fields.name.handleChange('newValue')
    @form.handleSubmit()

    @form.fields.name.handleChange('newValue')
    @form.handleSubmit()

    expect(submitHandler).to.have.been.calledOnce
    expect(submitHandler).to.have.been.calledWith({name: 'newValue'})
    assert.equal(@form.submitting, false)

  it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: true", ->
    submitHandler = sinon.spy();
    @form.onSubmit(submitHandler)
    @form.config.allowSubmitUnchangedForm = true

    @form.fields.name.handleChange('newValue')
    @form.handleSubmit()

    @form.fields.name.handleChange('newValue')
    @form.handleSubmit()

    expect(submitHandler).to.have.been.calledTwice

  it "disallow submit invalid form", ->
    submitHandler = sinon.spy();
    @form.onSubmit(submitHandler)
    @form.setValidateCb((errors) -> errors.name = 'invalid' )

    @form.fields.name.handleChange('newValue')
    @form.handleSubmit()

    expect(submitHandler).to.have.not.been.called
    assert.equal(@form.submitting, false)

  it "run submit without submit callback", ->
    @form.fields.name.handleChange('newValue')

    assert.deepEqual(@form.unsavedValues, { name: 'newValue' })
    assert.isTrue(@form.dirty)
    @form.handleSubmit()

    assert.equal(@form.submitting, false)
    assert.deepEqual(@form.unsavedValues, {})
    assert.isFalse(@form.dirty)

  it "check updated unsaved values. config.allowUpdateSavedValuesAfterSubmit: true", ->
    @form.fields.name.setSavedValue('savedValue')
    @form.fields.name.handleChange('newValue')

    assert.deepEqual(@form.fields.name.savedValue, 'savedValue')
    assert.deepEqual(@form.savedValues, { name: 'savedValue' })
    assert.isTrue(@form.dirty)
    @form.handleSubmit()

    assert.equal(@form.submitting, false)
    assert.equal(@form.fields.name.savedValue, 'newValue')
    assert.deepEqual(@form.savedValues, { name: 'newValue' })
    assert.isFalse(@form.dirty)

  it "don't update saved values after submit. config.allowUpdateSavedValuesAfterSubmit: false", ->
    @form.config.allowUpdateSavedValuesAfterSubmit = false
    @form.fields.name.setSavedValue('savedValue')
    @form.fields.name.handleChange('newValue')

    assert.deepEqual(@form.fields.name.savedValue, 'savedValue')
    assert.deepEqual(@form.savedValues, { name: 'savedValue' })
    assert.isTrue(@form.dirty)
    @form.handleSubmit()

    assert.equal(@form.submitting, false)
    assert.equal(@form.fields.name.savedValue, 'savedValue')
    assert.deepEqual(@form.savedValues, { name: 'savedValue' })
    assert.isTrue(@form.dirty)
