formkit = require('../../src/index')


describe 'Functional. destory.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init([ 'name' ])
    @field = @form.fields.name

  it "form destroy", ->
    @form._debouncedSave._mainPromise = Promise.resolve()
    @form._submitPromise = Promise.resolve()

    @form.on('change', ->)
    @form.on('storage', ->)
    @form.on('submitStart', ->)
    @form.on('submitEnd', ->)
    @field.on('change', ->)
    @field.on('storage', ->)
    @field.on('saveStart', ->)
    @field.on('saveEnd', ->)
    @form.onChange(->)
    @form.onSubmit(->)
    @form.onSave(->)

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
    assert.isFunction(@form._handlers.onChange)
    assert.isFunction(@form._handlers.onSubmit)
    assert.isFunction(@form._handlers.onSave)

    @form.destroy()

    Promise.all([ @form._debouncedSave._mainPromise, @form._submitPromise ])
      .then =>
        assert.deepEqual(@form._storage._store, {})
        assert.equal(@form._storage.getListeners('change').length, 0)
        assert.equal(@form._storage.getListeners('storage').length, 0)
        assert.equal(@form._storage.getListeners('submitStart').length, 0)
        assert.equal(@form._storage.getListeners('submitEnd').length, 0)
        assert.equal(@form._storage.getListeners('field.name.change').length, 0)
        assert.equal(@form._storage.getListeners('field.name.storage').length, 0)
        assert.equal(@form._storage.getListeners('field.name.saveStart').length, 0)
        assert.equal(@form._storage.getListeners('field.name.saveEnd').length, 0)
        assert.isNotFunction(@form._handlers.onChange)
        assert.isNotFunction(@form._handlers.onSubmit)
        assert.isNotFunction(@form._handlers.onSave)
