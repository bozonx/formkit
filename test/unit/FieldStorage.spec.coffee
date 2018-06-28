Storage = require('../../src/Storage').default
FieldStorage = require('../../src/FieldStorage').default


describe 'Unit. FieldStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @formStorage = {
      emitStorageEvent: sinon.spy()
    }
    @fieldStorage = new FieldStorage(@storage, @formStorage)
    @pathToField = 'path.to.field'

  it 'initState', ->
    @fieldStorage.initState(@pathToField, { dirty: true, touched: true })

    assert.deepEqual(@storage.getWholeFieldState(@pathToField), {
      @storage.generateNewFieldState()...
      dirty: true
      touched: true
    })

  it 'get and set state', ->
    @fieldStorage.setStateSilent(@pathToField, { dirty: true, touched: true })
    @fieldStorage.setStateSilent(@pathToField, { saving: true })

    assert.isTrue(@fieldStorage.getState(@pathToField, 'dirty'))
    assert.isTrue(@fieldStorage.getState(@pathToField, 'touched'))
    assert.isTrue(@fieldStorage.getState(@pathToField, 'saving'))

  it 'get and set value', ->
    @fieldStorage.setStateSilent(@pathToField, {
      savedValue: 'saved'
      editedValue: 'edited'
    })

    assert.equal(@fieldStorage.getState(@pathToField, 'savedValue'), 'saved')
    assert.equal(@fieldStorage.getState(@pathToField, 'editedValue'), 'edited')
    assert.equal(@fieldStorage.getCombinedValue(@pathToField), 'edited')

  it 'isFieldUnsaved', ->
    @fieldStorage.setStateSilent(@pathToField, {
      savedValue: 'saved'
      editedValue: 'edited'
    })

    assert.isTrue(@fieldStorage.isFieldUnsaved(@pathToField))

    @fieldStorage.setStateSilent(@pathToField, { savedValue: 'edited' })

    assert.isFalse(@fieldStorage.isFieldUnsaved(@pathToField))

  it 'emitStorageEvent', ->
    handleChange = sinon.spy()
    @fieldStorage.on(@pathToField, 'storage', handleChange)

    @fieldStorage.emitStorageEvent(@pathToField, 'newState', 'prevState')

    sinon.assert.calledWith(handleChange, {
      event: 'storage',
      field: 'path.to.field',
      prevState: 'prevState',
      state: 'newState',
      target: 'field'
    })
    sinon.assert.calledWith(@formStorage.emitStorageEvent, 'newState', 'prevState')
