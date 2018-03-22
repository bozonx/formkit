formkit = require('../../src/index')
Field = require('../../src/Field')


describe 'Unit. Field.', ->
  beforeEach () ->
    @pathToField = 'testField'
    @form = formkit.newForm()
    @form.init(['testField'])

  it "_initState without params", ->
    storageChangeHandler = sinon.spy()
    @form.validate = sinon.spy()
    @form._fieldStorage.on(@pathToField, 'storage', storageChangeHandler)
    @form._storage._store.fieldsState[@pathToField] = undefined
    field = new Field(@pathToField, {}, @form, @form._fieldStorage)

    assert.deepEqual(@form._storage.getWholeFieldState(@pathToField), {
      defaultValue: undefined
      dirty: false
      disabled: false
      editedValue: undefined
      initial: undefined
      focused: false
      invalidMsg: undefined
      savedValue: undefined
      saving: false
      touched: false
      valid: true
    })

    assert.isUndefined(field.value)
    sinon.assert.notCalled(@form.validate)
    sinon.assert.calledOnce(storageChangeHandler)

  it "_initState with initial params", ->
    storageChangeHandler = sinon.spy()
    @form.validate = sinon.spy()
    @form._fieldStorage.on(@pathToField, 'storage', storageChangeHandler)
    params = { disabled: true, defaultValue: 5, initial: 7 }
    @form._storage._store.fieldsState[@pathToField] = undefined
    field = new Field(@pathToField, params, @form, @form._fieldStorage)

    assert.deepEqual(@form._storage.getWholeFieldState(@pathToField), {
      defaultValue: 5
      dirty: false
      initial: 7
      disabled: true
      editedValue: 7
      focused: false
      invalidMsg: undefined
      savedValue: undefined
      saving: false
      touched: false
      valid: true
    })

    assert.equal(field.value, 7)
    sinon.assert.calledOnce(@form.validate)
    sinon.assert.calledTwice(storageChangeHandler)

#    sinon.assert.calledWith storageChangeHandler, {
#      action: "update",
#      event: "storage",
#      field: "testField",
#      oldState: undefined,
#      state: {
#        defaultValue: 5,
#        dirty: false,
#        disabled: true,
#        focused: false,
#        initial: 7,
#        invalidMsg: undefined,
#        savedValue: undefined,
#        saving: false,
#        touched: false,
#        valid: true
#      },
#      type: "state"
#      target: "field"
#    }
#    sinon.assert.calledWith storageChangeHandler, {
#      action: 'replace',
#      event: 'storage',
#      field: 'testField',
#      oldValue: undefined,
#      type: 'value',
#      value: 7
#      target: "field"
#    }
