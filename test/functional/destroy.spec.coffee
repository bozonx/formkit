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

    assert.deepEqual(@form._storage.getCombinedValues(), { name: 'newValue' })
    assert.equal(@form._storage.getListeners('change').length, 1)
    assert.equal(@form._storage.getListeners('storage').length, 1)
    assert.equal(@form._storage.getListeners('submitStart').length, 1)
    assert.equal(@form._storage.getListeners('submitEnd').length, 1)
    assert.equal(@form._storage.getListeners('field.name.change').length, 1)
    assert.equal(@form._storage.getListeners('field.name.storage').length, 1)
    assert.equal(@form._storage.getListeners('field.name.saveStart').length, 1)
    assert.equal(@form._storage.getListeners('field.name.saveEnd').length, 1)

    @form.destroy()

    assert.deepEqual(@form._storage._store, {})
    assert.equal(@form._storage.getListeners('change').length, 0)
    assert.equal(@form._storage.getListeners('storage').length, 0)
    assert.equal(@form._storage.getListeners('submitStart').length, 0)
    assert.equal(@form._storage.getListeners('submitEnd').length, 0)
    assert.equal(@form._storage.getListeners('field.name.change').length, 0)
    assert.equal(@form._storage.getListeners('field.name.storage').length, 0)
    assert.equal(@form._storage.getListeners('field.name.saveStart').length, 0)
    assert.equal(@form._storage.getListeners('field.name.saveEnd').length, 0)
