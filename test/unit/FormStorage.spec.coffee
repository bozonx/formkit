Storage = require('../../src/Storage').default
FormStorage = require('../../src/FormStorage').default


describe 'Unit. FormStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @formStorage = new FormStorage(@storage)

  it "get and set form state", ->
    @formStorage.setStateSilent({ editedValue: 1, touched: true })
    @formStorage.setStateSilent({ submitting: true })

    assert.equal(@formStorage.getState('editedValue'), 1)
    assert.isTrue(@formStorage.getState('touched'))
    assert.isTrue(@formStorage.getState('submitting'))
    assert.isTrue(@formStorage.getState('valid'))

  it "emitStorageEvent", ->
    changeHandler = sinon.spy()
    @formStorage.on('storage', changeHandler)
    @formStorage.emitStorageEvent('newState', 'prevState')

    sinon.assert.calledOnce(changeHandler)
    sinon.assert.calledWith(changeHandler, {
      action: 'update',
      event: 'storage',
      prevState: 'prevState',
      state: 'newState',
      target: 'form',
    })

  it "getValues", ->
    @storage.setFieldState('path.to.field', {
      savedValue: 'saved'
      editedValue: 'newValue'
    })
    assert.deepEqual(@formStorage.getCombinedValues(), {
      path: {
        to: {
          field: 'newValue'
        }
      }
    })

  it "getEditedValues", ->
    @storage.setFieldState('path.to.field', { editedValue: 'value' })
    assert.deepEqual(@formStorage.getEditedValues(), {
      path: {
        to: {
          field: 'value'
        }
      }
    })

  it "getSavedValues", ->
    @storage.setFieldState('path.to.field', { savedValue: 'value' })
    assert.deepEqual(@formStorage.getSavedValues(), {
      path: {
        to: {
          field: 'value'
        }
      }
    })

  it "getUnSavedValues - edited is undefined", ->
    @storage.setFieldState('path.to.field', {
      savedValue: 'value'
      editedValue: undefined
    })
    assert.deepEqual(@formStorage.getUnSavedValues(), {})

  it "getUnSavedValues - edited is defined and the same as saved value", ->
    @storage.setFieldState('path.to.field', {
      savedValue: 'value'
      editedValue: 'value'
    })
    assert.deepEqual(@formStorage.getUnSavedValues(), {})

  it "getUnSavedValues - edited is defined and different", ->
    @storage.setFieldState('path.to.field', {
      savedValue: 'value'
      editedValue: 5
    })
    assert.deepEqual(@formStorage.getUnSavedValues(), {
      path: {
        to: {
          field: 5
        }
      }
    })

  it "getInvalidMessages", ->
    @storage.setFieldState('field', { invalidMsg: 'value' })
    assert.deepEqual(@formStorage.getInvalidMessages(), [
      {
        field: 'field'
        message: 'value'
      }
    ])
