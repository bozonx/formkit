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

    handleSubmitReturn
      .catch =>
        assert.isFalse(@form.submitting)

  it "run submit without submit callback", ->
    @form.fields.name.handleChange('newValue')

    assert.deepEqual(@form.unsavedValues, { name: 'newValue' })
    assert.isTrue(@form.dirty)
    @form.handleSubmit()

    assert.equal(@form.submitting, false)
    # TODO: должно сброситься после сабмита даже если не было установленно callback
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
    # TODO: должно было установиться newValue даже если не было назначина submit handler
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

  describe "canSubmit()", ->
    it "don't submit while form is submitting at the moment.", ->
      @form.onSubmit(-> Promise.resolve())
      @form.fields.name.handleChange('newValue')
      @form.handleSubmit()

      assert.isTrue(@form.submitting)
      assert.equal(@form.canSubmit(), 'The form is submitting now.')

    it "disallow submit invalid form", ->
      @form.onSubmit(sinon.spy())
      @form.setValidateCb((errors) -> errors.name = 'invalid' )
      @form.fields.name.handleChange('newValue')

      @form.handleSubmit()

      assert.equal(@form.canSubmit(), 'The form is invalid.')

    it "don't do submit on clear form", ->
      @form.onSubmit(sinon.spy())

      @form.handleSubmit()

      assert.equal(@form.canSubmit(), 'The form hasn\'t changed.')

    it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: false", ->
      @form.onSubmit(sinon.spy())

      @form.fields.name.handleChange('newValue')
      @form.handleSubmit()

      # TODO: dirty не сбросился после submit

      assert.equal(@form.canSubmit(), 'The form hasn\'t changed.')

    it "don't do another submit if data hasn't changed. config.allowSubmitUnchangedForm: true", ->
      @form.onSubmit(sinon.spy())
      @form._config.allowSubmitUnchangedForm = true

      @form.fields.name.handleChange('newValue')
      @form.handleSubmit()

      assert.isUndefined(@form.canSubmit())
