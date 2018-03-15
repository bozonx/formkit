formkit = require('../../src/index')
Field = require('../../src/Field')


describe.only 'Unit. Field.', ->
  beforeEach () ->
    @pathToField = 'testField'
    @form = formkit.newForm()
    @form.init(['testField'])

  it "_initState without params", ->
    storageChangeHandler = sinon.spy()
    @form.validate = sinon.spy()
    @form._fieldStorage.on(@pathToField, 'storage', storageChangeHandler)
    field = new Field(@pathToField, {}, { form: @form, fieldStorage: @form._fieldStorage })

    assert.deepEqual(@form._storage.getWholeFieldState(@pathToField), {
      defaultValue: undefined
      dirty: false
      disabled: undefined
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

    # TODO: доделать
    sinon.assert.calledOnce(storageChangeHandler)

  it "_initState with initial params", ->
    storageChangeHandler = sinon.spy()
    @form.validate = sinon.spy()
    @form._fieldStorage.on(@pathToField, 'storage', storageChangeHandler)
    params = { disabled: true, defaultValue: 5, initial: 7 }
    field = new Field(@pathToField, params, { form: @form, fieldStorage: @form._fieldStorage })

    assert.deepEqual(@form._storage.getWholeFieldState(@pathToField), {
      defaultValue: 5
      dirty: false
      initial: 7
      disabled: true
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

    # TODO: доделать

#    sinon.assert.calledWith storageChangeHandler, {
#
#    }
    sinon.assert.calledWith storageChangeHandler, {
      action: 'replace',
      event: 'storage',
      field: 'testField',
      oldValue: undefined,
      type: 'value',
      value: 7
    }
