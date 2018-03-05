formHelper = require('../../src/index')


describe 'Functional. Validate.', ->
  beforeEach () ->
    @form = formHelper.newForm()

  it.only 'formValues', ->
    validator = sinon.stub().returns(true)
    @form.fields.name.setValidateCb(validator)

    @form.fields.name.handleChange('newValue')

    sinon.assert.calledWith(validator, { value: 'newValue', formValues: { name: 'newValue' } })

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
    assert.deepEqual(@form.invalidMessages, [{path: 'name', message: 'errorMsg'}])


  # TODO: test deep fields errors


  it 'validateCb cb returns false and after that returns true', ->
    @form.fields.name.setValidateCb((params) -> !!params.value)
    @form.fields.name.handleChange(0)
    @form.fields.name.handleChange(1)

    assert.isTrue(@form.fields.name.valid)
    assert.isUndefined(@form.fields.name.invalidMsg)
    assert.isTrue(@form.valid)
    assert.deepEqual(@form.invalidMessages, [])

  it 'validateCb cb returns an empty string = throws an error', ->
    assert.throws(@form.fields.name.setValidateCb.bind(@form.fields.name, () -> ''), /empty string/);

  it 'validateCb cb returns undefined = throws an error', ->
    assert.throws(@form.fields.name.setValidateCb.bind(@form.fields.name, () -> undefined), /undefined/);
