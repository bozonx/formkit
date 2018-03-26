formkit = require('../../src/index')


describe 'Unit. Field.', ->
  beforeEach () ->
    @form = formkit.newForm()

  it "init as array", ->
    @form.init([ 'field1', 'parent.field2' ])

    assert.deepEqual(@form.values, {
      field1: undefined
      parent: {
        field2: undefined
      }
    })

  it "init as plain object with plain names", ->
    @form.init({
      field1: { initial: 1 }
      'parent.field2': {}
    })

    assert.deepEqual(@form.values, {
      field1: 1
      parent: {
        field2: undefined
      }
    })

  it "init as schema", ->
    @form.init({
      field1: {}
      parent: {
        field2: { initial: 1 }
      }
    })

    assert.deepEqual(@form.values, {
      field1: undefined
      parent: {
        field2: 1
      }
    })

  it "setValues", ->
    storageHandler = sinon.spy()
    @form.on('storage', storageHandler)
    @form.init([ 'field1' ])

    @form.setValues({
      field1: {
        id: 1
      }
    })

    assert.deepEqual(@form.values, {
      field1: { id : 1 }
    })
    sinon.assert.calledTwice(storageHandler)

  it "setSavedValues", ->
    storageHandler = sinon.spy()
    @form.on('storage', storageHandler)
    @form.init([ 'field1' ])

    @form.setSavedValues({
      field1: {
        id: 1
      }
    })

    assert.deepEqual(@form.values, {
      field1: { id : 1 }
    })
    #sinon.assert.calledTwice(storageHandler)
