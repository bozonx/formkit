formkit = require('../../src/index')


describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init(['name'])
    @field = @form.fields.name

    @fieldOnChangeHandler = sinon.spy();
    @formOnChangeHandler = sinon.spy();
    @formOnSaveHandler = sinon.stub().returns(Promise.resolve());
    @formSaveEndHandler = sinon.spy();
    @fieldStorageHandler = sinon.spy();
    @formStorageHandler = sinon.spy();

    @field.onChange(@fieldOnChangeHandler);
    @form.onChange(@formOnChangeHandler);
    @form.onSave(@formOnSaveHandler);
    @form.on('saveEnd', @formSaveEndHandler);
    @field.on('storage', @fieldStorageHandler);
    @form.on('storage', @formStorageHandler);

  it "call after setValue", ->
    @field.handleChange('userValue')

    sinon.assert.calledOnce(@formStorageHandler)

    @form.flushSaving();

    sinon.assert.calledTwice(@formStorageHandler)

    result = {
      event: 'change'
      field: "name"
      oldValue: undefined
      value: "userValue"
    }

    sinon.assert.calledOnce(@fieldOnChangeHandler)
    sinon.assert.calledWith(@fieldOnChangeHandler, result)

    sinon.assert.calledOnce(@formOnChangeHandler)
    sinon.assert.calledWith(@formOnChangeHandler, result)
    sinon.assert.calledOnce(@fieldStorageHandler)

    @form._debouncedSave.getPromise()
      .then =>
        sinon.assert.calledThrice(@formStorageHandler)

  it "don't call after machine update", ->
    @field.setValue('machineValue')

    sinon.assert.notCalled(@fieldOnChangeHandler)
    sinon.assert.notCalled(@formOnChangeHandler)
    sinon.assert.calledOnce(@fieldStorageHandler)
    sinon.assert.calledOnce(@formStorageHandler)

  it "it doesn't rise events on set initial values", ->
    @field.setValue('initialValue')

    sinon.assert.notCalled(@fieldOnChangeHandler)
    sinon.assert.notCalled(@formOnChangeHandler)

  it "call after uncahnged value if config.allowSaveUnmodifiedField = true.
           It saves even form isn't modified", ->
    @form.config.allowSaveUnmodifiedField = true;
    @field.handleChange('userValue')
    @field.handleChange('userValue')

    @form.flushSaving();

    sinon.assert.calledTwice(@fieldOnChangeHandler)
    sinon.assert.calledTwice(@formOnChangeHandler)

    @form._debouncedSave.getPromise()
      .then =>
        sinon.assert.calledOnce(@formOnSaveHandler)
        sinon.assert.calledOnce(@formSaveEndHandler)

  it "don't call after uncahnged value if config.allowSaveUnmodifiedField = false", ->
    @form.config.allowSaveUnmodifiedField = false;
    @field.handleChange('userValue')
    @field.handleChange('userValue')

    @form.flushSaving();

    result = {
      event: 'change'
      field: "name"
      oldValue: undefined
      value: "userValue"
    }

    sinon.assert.calledOnce(@fieldOnChangeHandler)
    sinon.assert.calledWith(@fieldOnChangeHandler, result)

    sinon.assert.calledOnce(@formOnChangeHandler)
    sinon.assert.calledWith(@formOnChangeHandler, result)

    @form._debouncedSave.getPromise()
      .then =>
        sinon.assert.calledOnce(@formOnSaveHandler)
        sinon.assert.calledOnce(@formSaveEndHandler)

  it "don't do anything if disabled", ->
    @field.handleChange('oldValue')
    @field.setDisabled(true)
    @field.handleChange('newValue')
    @form.flushSaving();

    assert.equal(@field.value, 'oldValue')
