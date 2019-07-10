formkit = require('../../src/formkit')


describe 'Functional. destory.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init([ 'name' ])
    @field = @form.fields.name

  it "form destroy", ->
    @form.saveControl.debouncedSave.mainPromise = Promise.resolve()

    @form.on('change', ->)
    @form.on('storage', ->)
    @form.on('submitStart', ->)
    @form.on('submitEnd', ->)
    @field.on('change', ->)
    @field.on('storage', ->)
    @field.on('saveStart', ->)
    @field.on('saveEnd', ->)
    @form.onSubmit(->)
    @form.onSave(->)

    @field.setValue('newValue')

    assert.deepEqual(@form.storage.getCombinedValues(), { name: 'newValue' })
    assert.equal(@form.storage.getListeners('change').length, 1)
    assert.equal(@form.storage.getListeners('storage').length, 1)
    assert.equal(@form.storage.getListeners('submitStart').length, 1)
    assert.equal(@form.storage.getListeners('submitEnd').length, 1)
    assert.equal(@form.storage.getListeners('name.change').length, 1)
    assert.equal(@form.storage.getListeners('name.storage').length, 1)
    assert.equal(@form.storage.getListeners('name.saveStart').length, 1)
    assert.equal(@form.storage.getListeners('name.saveEnd').length, 1)
#    assert.isFunction(@form.handlers.onSubmit)
#    assert.isFunction(@form.handlers.onSave)

    @form.destroy()

    await Promise.all([ @form.saveControl.debouncedSave.mainPromise ])

    # TODO: uncomment
    #assert.deepEqual(@form.storage.store, {})
    assert.equal(@form.storage.getListeners('change').length, 0)
    assert.equal(@form.storage.getListeners('storage').length, 0)
    assert.equal(@form.storage.getListeners('submitStart').length, 0)
    assert.equal(@form.storage.getListeners('submitEnd').length, 0)
    assert.equal(@form.storage.getListeners('name.change').length, 0)
    assert.equal(@form.storage.getListeners('name.storage').length, 0)
    assert.equal(@form.storage.getListeners('name.saveStart').length, 0)
    assert.equal(@form.storage.getListeners('name.saveEnd').length, 0)
#    assert.isNotFunction(@form.handlers.onSubmit)
#    assert.isNotFunction(@form.handlers.onSave)
