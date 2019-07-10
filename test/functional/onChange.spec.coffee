formkit = require('../../src/formkit')


describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init(['name'])
    @field = @form.fields.name

    @fieldChangeHandler = sinon.spy();
    @formChangeHandler = sinon.spy();
    @formOnSaveHandler = sinon.stub().returns(Promise.resolve());
    @formSaveEndHandler = sinon.spy();
    @fieldStorageHandler = sinon.spy();
    @formStorageHandler = sinon.spy();

    @form.on('change', @formChangeHandler);
    @form.onSave(@formOnSaveHandler);
    @form.on('saveEnd', @formSaveEndHandler);
    @form.on('storage', @formStorageHandler);
    @field.on('change', @fieldChangeHandler);
    @field.on('storage', @fieldStorageHandler);

  it "call after setValue", ->
    @field.handleChange('userValue')

    sinon.assert.calledOnce(@formStorageHandler)

    @form.flushSaving();

    sinon.assert.calledTwice(@formStorageHandler)

    result = {
      field: "name"
      prevValue: undefined
      value: "userValue"
    }

    sinon.assert.calledOnce(@fieldChangeHandler)
    sinon.assert.calledWith(@fieldChangeHandler, result)

    sinon.assert.calledOnce(@formChangeHandler)
    sinon.assert.calledWith(@formChangeHandler, result)
    sinon.assert.calledOnce(@fieldStorageHandler)

    @form.saveControl.getSavePromise()
      .then =>
        sinon.assert.calledThrice(@formStorageHandler)

  it "don't call after machine update", ->
    @field.setValue('machineValue')

    sinon.assert.notCalled(@fieldChangeHandler)
    sinon.assert.notCalled(@formChangeHandler)
    sinon.assert.calledOnce(@fieldStorageHandler)
    sinon.assert.calledOnce(@formStorageHandler)

  it "it doesn't rise events on set initial values", ->
    @field.setValue('initialValue')

    sinon.assert.notCalled(@fieldChangeHandler)
    sinon.assert.notCalled(@formChangeHandler)

  it "call after uncahnged value if config.allowSaveUnmodifiedField = true.
           It saves even form isn't modified", ->
    @form.config.allowSaveUnmodifiedField = true;
    @field.handleChange('userValue')
    @field.handleChange('userValue')

    @form.flushSaving();

    sinon.assert.calledTwice(@fieldChangeHandler)
    sinon.assert.calledTwice(@formChangeHandler)

    @form.saveControl.getSavePromise()
      .then =>
        sinon.assert.calledOnce(@formOnSaveHandler)
        sinon.assert.calledOnce(@formSaveEndHandler)

  it "don't call after uncahnged value if config.allowSaveUnmodifiedField = false", ->
    @form.config.allowSaveUnmodifiedField = false;
    @field.handleChange('userValue')
    @field.handleChange('userValue')

    @form.flushSaving();

    result = {
      field: "name"
      prevValue: undefined
      value: "userValue"
    }

    sinon.assert.calledOnce(@fieldChangeHandler)
    sinon.assert.calledWith(@fieldChangeHandler, result)

    sinon.assert.calledOnce(@formChangeHandler)
    sinon.assert.calledWith(@formChangeHandler, result)

    @form.saveControl.getSavePromise()
      .then =>
        sinon.assert.calledOnce(@formOnSaveHandler)
        sinon.assert.calledOnce(@formSaveEndHandler)

  it "don't do anything if disabled", ->
    @field.handleChange('prevValue')
    @field.setDisabled(true)
    @field.handleChange('newValue')
    @form.flushSaving();

    assert.equal(@field.value, 'prevValue')
