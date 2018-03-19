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
    # TODO: state events

  it "get and set state", ->
    @fieldStorage.setState(@pathToField, { dirty: true, touched: true })
    @fieldStorage.setState(@pathToField, { saving: true })

    assert.isTrue(@fieldStorage.getState(@pathToField, 'dirty'))
    assert.isTrue(@fieldStorage.getState(@pathToField, 'touched'))
    assert.isTrue(@fieldStorage.getState(@pathToField, 'saving'))

  # TODO: state events

  it "get and set value", ->
    @fieldStorage.setValue(@pathToField, 'value')

    assert.equal(@fieldStorage.getValue(@pathToField), 'value')

  # TODO: value events

