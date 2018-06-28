formkit = require('../../src/index')
Field = require('../../src/Field').default


describe.only 'Unit. Field.', ->
  beforeEach () ->
    @pathToField = 'testField'
    @form = formkit.newForm()
    @form.init(['testField'])
    @field = @form.fields.testField

  it "_initState without params", ->
    storageChangeHandler = sinon.spy()
    @form.fieldStorage.on(@pathToField, 'storage', storageChangeHandler)
    @form.storage.store.fieldsState[@pathToField] = undefined
    field = new Field(@pathToField, {}, @form, @form.fieldStorage)

    assert.deepEqual(@form.storage.getWholeFieldState(@pathToField), {
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
    })

    assert.isUndefined(field.value)
    sinon.assert.notCalled(storageChangeHandler)

  it "_initState with initial params", ->
    storageChangeHandler = sinon.spy()
    @form.fieldStorage.on(@pathToField, 'storage', storageChangeHandler)
    params = {
      disabled: true
      defaultValue: 5
      initial: 7
      savedValue: 9
    }
    @form.storage.store.fieldsState[@pathToField] = undefined
    field = new Field(@pathToField, params, @form, @form.fieldStorage)

    assert.deepEqual(@form.storage.getWholeFieldState(@pathToField), {
      defaultValue: 5
      dirty: false
      initial: 7
      disabled: true
      editedValue: 7
      focused: false
      invalidMsg: undefined
      savedValue: 9
      saving: false
      touched: false
    })

    assert.equal(field.value, 7)
    sinon.assert.notCalled(storageChangeHandler)

  it "setValue", ->
    formStorageChangeHandler = sinon.spy()
    fieldStorageChangeHandler = sinon.spy()
    @field._form.on('storage', formStorageChangeHandler)
    @field.on('storage', fieldStorageChangeHandler)
    @field.setValue('editedValue')

    assert.equal(@field.editedValue, 'editedValue')

    sinon.assert.calledOnce(formStorageChangeHandler)
    sinon.assert.calledOnce(fieldStorageChangeHandler)

  it "setValue - don't rise if value hasn't changed", ->
    formStorageChangeHandler = sinon.spy()
    fieldStorageChangeHandler = sinon.spy()
    @field._form.on('storage', formStorageChangeHandler)
    @field.on('storage', fieldStorageChangeHandler)

    @field.setValue('editedValue')
    @field.setValue('editedValue')

    sinon.assert.calledOnce(formStorageChangeHandler)
    sinon.assert.calledWith(formStorageChangeHandler, {
      action: 'update'
      event: 'storage'
      field: 'testField'
      prevState: {
        defaultValue: undefined
        dirty: false
        disabled: false
        editedValue: undefined
        focused: false
        initial: undefined
        invalidMsg: undefined
        savedValue: undefined
        saving: false
        touched: false
      }
      state: {
        defaultValue: undefined
        dirty: true
        disabled: false
        editedValue: 'editedValue'
        focused: false
        initial: undefined
        invalidMsg: undefined
        savedValue: undefined
        saving: false
        touched: false
      }
      target: 'field'
    })

    sinon.assert.calledOnce(fieldStorageChangeHandler)
    sinon.assert.calledWith(fieldStorageChangeHandler, {
      action: 'update'
      event: 'storage'
      field: 'testField'
      prevState: {
        defaultValue: undefined
        dirty: false
        disabled: false
        editedValue: undefined
        focused: false
        initial: undefined
        invalidMsg: undefined
        savedValue: undefined
        saving: false
        touched: false
      }
      state: {
        defaultValue: undefined
        dirty: true
        disabled: false
        editedValue: 'editedValue'
        focused: false
        initial: undefined
        invalidMsg: undefined
        savedValue: undefined
        saving: false
        touched: false
      }
      target: 'field'
    })
