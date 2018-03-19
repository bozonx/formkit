Storage = require('../../src/Storage')
FormStorage = require('../../src/FormStorage')


describe 'Unit. FieldStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @formStorage = new FormStorage(@storage)

  it "get and set form state", ->
    @formStorage.setState({ dirty: true, touched: true })
    @formStorage.setState({ submitting: true })

    assert.isTrue(@formStorage.getState('dirty'))
    assert.isTrue(@formStorage.getState('touched'))
    assert.isTrue(@formStorage.getState('submitting'))
    assert.isFalse(@formStorage.getState('saving'))

  it "storage change event", ->
    changeHandler = sinon.spy()
    @formStorage.on('storage', changeHandler)
    @formStorage.setState({ submitting: true })

    sinon.assert.calledOnce(changeHandler)
    sinon.assert.calledWith(changeHandler, {
      action: "update",
      event: "storage",
      oldState: { dirty: false, saving: false, submitting: false, touched: false },
      state: { submitting: true },
      target: "form",
      type: "state"
    })

  it "getValues", ->
    @storage.setValue('path.to.field', 'newValue')
    assert.deepEqual(@formStorage.getValues(), {
      path: {
        to: {
          field: 'newValue'
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

  it "getInvalidMessages", ->
    @storage.setFieldState('field', { invalidMsg: 'value' })
    assert.deepEqual(@formStorage.getInvalidMessages(), [
      {
        path: 'field'
        message: 'value'
      }
    ])
