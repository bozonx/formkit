formkit = require('../../src/index')
Field = require('../../src/Field')


describe.only 'Unit. Field.', ->
  beforeEach () ->
    @pathToField = 'testField'
    @form = formkit.newForm()
    @form.init(['testField'])

  it "_initState without params", ->
    field = new Field(@pathToField, {}, { form: @form, fieldStorage: @form._fieldStorage })

    assert.deepEqual(@form._storage.getWholeFieldState(@pathToField), {
      defaultValue: undefined
      dirty: false
      disabled: undefined
      focused: false
      invalidMsg: undefined
      savedValue: undefined
      saving: false
      touched: false
      valid: true
    })

    # TODO: test - dirty должен быть false
    # TODO: test - должны подняться только storageChange события
