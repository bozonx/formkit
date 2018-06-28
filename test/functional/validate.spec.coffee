formkit = require('../../src/index')


describe 'Functional. Validate.', ->
  beforeEach () ->
    @form = formkit.newForm()

  it 'params hierarchy', ->
    validateCb = sinon.spy()
    @form.init([
      'parent1.subParam1'
      'parent2.subParam2'
    ], validateCb)

    @form.fields.parent1.subParam1.handleChange('newValue')

    sinon.assert.calledTwice(validateCb)
    # init
    sinon.assert.calledWith(validateCb.firstCall, { parent1: {}, parent2: {} }, {
      parent1: {
        subParam1: undefined
      }
      parent2: {
        subParam2: undefined
      }
    })
    # change
    sinon.assert.calledWith(validateCb.secondCall, { parent1: {}, parent2: {} }, {
      parent1: {
        subParam1: 'newValue'
      }
      parent2: {
        subParam2: undefined
      }
    })

  it 'params hierarchy - check result', ->
    validateCb = (errors, values) ->
      errors.parent.subParam = 'error'
    @form.init([
      'topParam'
      'parent.subParam'
    ], validateCb)

    @form.fields.parent.subParam.handleChange('newValue')

    assert.deepEqual(@form.invalidMessages, [
      {
        message: 'error'
        field: 'parent.subParam'
      }
    ])

  it 'validate after setValidateCb', ->
    @form.init([ 'name' ])

    assert.isTrue(@form.valid)
    assert.isTrue(@form.fields.name.valid)

    validateCb = (error, values) -> error.name = 'errorMsg'
    @form.setValidateCb(validateCb)

    assert.isFalse(@form.valid)
    assert.isFalse(@form.fields.name.valid)

  it 'validateCb returns undefined. It means - valid', ->
    validateCb = -> undefined
    @form.init([ 'name' ], validateCb)
    @form.fields.name.handleChange('newValue')

    assert.isTrue(@form.fields.name.valid)
    assert.isUndefined(@form.fields.name.invalidMsg)
    assert.isTrue(@form.valid)
    assert.deepEqual(@form.invalidMessages, [])

  it 'validateCb cb returns message. It means an error', ->
    validateCb = (error, values) -> error.name = 'errorMsg'
    @form.init([ 'name' ], validateCb)
    @form.fields.name.handleChange('newValue')

    #assert.isFalse(@form.fields.name.valid)
    #assert.equal(@form.fields.name.invalidMsg, 'errorMsg')
    assert.isFalse(@form.valid)
    assert.deepEqual(@form.invalidMessages, [{ field: 'name', message: 'errorMsg' }])
