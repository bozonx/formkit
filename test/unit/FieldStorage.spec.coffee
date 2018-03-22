Storage = require('../../src/Storage')
FieldStorage = require('../../src/FieldStorage')


describe.only 'Unit. FieldStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @fieldStorage = new FieldStorage(@storage)
    @pathToField = 'path.to.field'

  it "initState", ->
    handleChange = sinon.spy()
    @fieldStorage.on(@pathToField, 'storage', handleChange)
    @fieldStorage.initState(@pathToField, { dirty: true, touched: true })

    assert.deepEqual(@storage.getWholeFieldState(@pathToField), {
      @storage.generateNewFieldState()...
      dirty: true
      touched: true
    })
    sinon.assert.calledOnce(handleChange)
    sinon.assert.calledWith(handleChange, {
      action: 'update'
      event: 'storage'
      field: 'path.to.field'
      oldState: undefined
      state: {
        defaultValue: undefined
        dirty: true
        disabled: false
        editedValue: undefined
        focused: false
        initial: undefined
        invalidMsg: undefined
        savedValue: undefined
        saving: false
        touched: true
        valid: true
      }
      target: 'field'
      type: 'state'
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
