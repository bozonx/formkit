formkit = require('../../src/index')


describe 'Functional. destory.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init([ 'name' ])
    @field = @form.fields.name

  it "form destroy", ->
    formChangeHandler = sinon.spy()
    formStorageHandler = sinon.spy()
    formSubmitStartHandler = sinon.spy()
    formSubmitEndHandler = sinon.spy()
    fieldChangeHandler = sinon.spy()
    fieldStorageHandler = sinon.spy()
    fieldSaveStartHandler = sinon.spy()
    fieldSaveEndHandler = sinon.spy()
    @form.on('change', formChangeHandler)
    @form.on('storage', formStorageHandler)
    @form.on('submitStart', formSubmitStartHandler)
    @form.on('submitEnd', formSubmitEndHandler)
    @field.on('change', fieldChangeHandler)
    @field.on('storage', fieldStorageHandler)
    @field.on('saveStart', fieldSaveStartHandler)
    @field.on('saveEnd', fieldSaveEndHandler)

    # TODO: callbacks ???

    @field.setValue('newValue')

    # TODO: check storage
    # TODO: check all the handler

    @form.destroy()

    # TODO: check storage
    # TODO: check all the callbacks
