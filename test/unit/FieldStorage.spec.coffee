Storage = require('../../src/Storage')
FieldStorage = require('../../src/FieldStorage')


describe 'Unit. FieldStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @fieldStorage = new FieldStorage(@storage)
    @pathToField = 'path.to.field'

  it "initState", ->
    @fieldStorage.initState(@pathToField, { dirty: true, touched: true })

    assert.deepEqual(@storage.getWholeFieldState(@pathToField), {
      @storage.generateNewFieldState()...
      dirty: true
      touched: true
    })

  it "get and set state", ->
    handleChange = sinon.spy()
    @fieldStorage.on(@pathToField, 'storage', handleChange)
    @fieldStorage.setState(@pathToField, { dirty: true, touched: true })
    @fieldStorage.setState(@pathToField, { saving: true })

    assert.isTrue(@fieldStorage.getState(@pathToField, 'dirty'))
    assert.isTrue(@fieldStorage.getState(@pathToField, 'touched'))
    assert.isTrue(@fieldStorage.getState(@pathToField, 'saving'))
    sinon.assert.calledTwice(handleChange)

  it "get and set value", ->
    @fieldStorage.setState(@pathToField, {
      savedValue: 'saved'
      editedValue: 'edited'
    })

    assert.equal(@fieldStorage.getState(@pathToField, 'savedValue'), 'saved')
    assert.equal(@fieldStorage.getState(@pathToField, 'editedValue'), 'edited')
    assert.equal(@fieldStorage.getCombinedValue(@pathToField), 'edited')

  it "isFieldUnsaved", ->
    @fieldStorage.setState(@pathToField, {
      savedValue: 'saved'
      editedValue: 'edited'
    })

    assert.isTrue(@fieldStorage.isFieldUnsaved(@pathToField))

    @fieldStorage.setState(@pathToField, { savedValue: 'edited' })

    assert.isFalse(@fieldStorage.isFieldUnsaved(@pathToField))
