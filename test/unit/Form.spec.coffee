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
    @form.init([ 'field1' ])
    storageHandler = sinon.spy()
    @form.on('storage', storageHandler)

    @form.setValues({
      field1: {
        id: 1
      }
    })

    assert.deepEqual(@form.values, {
      field1: { id : 1 }
    })
    sinon.assert.calledOnce(storageHandler)

  it "setSavedValues", ->
    @form.init([ 'field1' ])
    storageHandler = sinon.spy()
    @form.on('storage', storageHandler)

    @form.setSavedValues({
      field1: {
        id: 1
      }
    })

    assert.deepEqual(@form.values, {
      field1: { id : 1 }
    })
    sinon.assert.calledOnce(storageHandler)
