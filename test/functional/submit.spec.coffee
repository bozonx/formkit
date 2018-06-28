formkit = require('../../src/index')


describe.only 'Functional. Submit.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init(['name'])
    @field = @form.fields.name

  it 'simple submit', ->
    submitHandler = sinon.spy();
    submitStartHandler = sinon.spy();
    submitEndHandler = sinon.spy();
    @form.onSubmit(submitHandler)
    @form.on('submitStart', submitStartHandler)
    @form.on('submitEnd', submitEndHandler)

    @field.handleChange('newValue')
    @form.handleSubmit()

    sinon.assert.calledOnce(submitHandler)
    sinon.assert.calledWith(submitHandler, {
      values: { name: 'newValue' }
      editedValues: { name: 'newValue' }
    })
    sinon.assert.calledOnce(submitStartHandler)
    sinon.assert.calledWith(submitStartHandler, {
      values: { name: 'newValue' }
      editedValues: { name: 'newValue' }
    })
    sinon.assert.calledOnce(submitEndHandler)
    assert.isFalse(@form.submitting)

  it 'submitting with promise', ->
    submitEndHandler = sinon.spy();
    submitHandler = () ->
      return new Promise (resolve) =>
        resolve()
    @form.onSubmit(submitHandler)
    @form.on('submitEnd', submitEndHandler)

    @field.handleChange('newValue')
    handleSubmitReturn = @form.handleSubmit()

    assert.isTrue(@form.submitting)
    sinon.assert.notCalled(submitEndHandler)

    handleSubmitReturn.then () =>
      assert.isFalse(@form.submitting)
      sinon.assert.calledOnce(submitEndHandler)

  it 'rejected promise', ->
    submitHandler = ->
      new Promise (resolve, reject) =>
        reject(new Error('error'))
    @form.onSubmit(submitHandler)
    @field.handleChange('newValue')

    handleSubmitReturn = @form.handleSubmit()

    assert.isTrue(@form.submitting)
    expect(handleSubmitReturn).to.eventually.rejected

    handleSubmitReturn
      .catch =>
        assert.isFalse(@form.submitting)

  it "check values after submit - edited value moves to saved layer", ->
    @form.onSubmit ->
    @field.setSavedValue('savedValue')
    @field.handleChange('editedValue')

    assert.equal(@field.savedValue, 'savedValue')
    assert.equal(@field.editedValue, 'editedValue')
    assert.deepEqual(@form.savedValues, { name: 'savedValue' })
    assert.deepEqual(@form.editedValues, { name: 'editedValue' })
    assert.isTrue(@form.dirty)

    @form.handleSubmit()

    assert.equal(@form.submitting, false)
    assert.equal(@field.savedValue, 'editedValue')
    assert.equal(@field.editedValue, undefined )
    assert.deepEqual(@form.savedValues, { name: 'editedValue' })
    assert.deepEqual(@form.editedValues, {})
    assert.isFalse(@form.dirty)

  it "afterSubmitSuccess - check rised storage events", ->
    storageHandler = sinon.spy()
    @form.on('storage', storageHandler)

    @form.afterSubmitSuccess({ name: 'newValue' })

    assert.deepEqual(@form.values, { name: 'newValue' })
    sinon.assert.calledOnce(storageHandler)

  describe "canSubmit()", ->
    it "don't submit while form is submitting at the moment.", ->
      @form.onSubmit(-> Promise.resolve())
      @field.handleChange('newValue')
      @form.handleSubmit()

      assert.isTrue(@form.submitting)
      assert.equal(@form.canSubmit(), 'The form is submitting now.')

    it "disallow submit invalid form", ->
      @form.onSubmit(sinon.spy())
      @form.setValidateCb((errors) -> errors.name = 'invalid' )
      @field.handleChange('newValue')

      @form.handleSubmit()

      assert.equal(@form.canSubmit(), 'The form is invalid.')

    it "don't do submit on clear form", ->
      @form.onSubmit(sinon.spy())

      @form.handleSubmit()

      assert.equal(@form.canSubmit(), 'The form hasn\'t changed.')

    it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: false", ->
      @form.onSubmit(sinon.spy())

      @field.handleChange('newValue')
      @form.handleSubmit()

      assert.equal(@form.canSubmit(), 'The form hasn\'t changed.')

    it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: true", ->
      @form.onSubmit(sinon.spy())
      @form.config.allowSubmitUnchangedForm = true

      @field.handleChange('newValue')
      @form.handleSubmit()

      assert.isUndefined(@form.canSubmit())
