formHelper = require('../../src/index')


describe 'Functional. Validate.', ->
  beforeEach () ->
    @form = formHelper.newForm()
    @form.init(['name'])

  it 'form.setValidators', ->
    @form = formHelper.newForm()
    @form.init([ 'name', 'nested.name' ])
    validators = {
      name: () -> true
      nested: {
        name: () -> true
      }
    }
    @form.setValidators(validators)

    assert.equal(@form.fields.name._validateCallback, validators.name)

  it 'validate on init', ->
    @form = formHelper.newForm()
    @form.init({ name: {validate: () -> false} })

    assert.isFalse(@form.valid)
    assert.isFalse(@form.fields.name.valid)

  it 'validate after setValidateCb', ->
    @form.fields.name.setValidateCb(() -> false)

    assert.isFalse(@form.valid)
    assert.isFalse(@form.fields.name.valid)

  it 'set validateCb on init', ->
    @form = formHelper.newForm()
    @form.init({ name: {validate: () -> false} })

    @form.fields.name.handleChange('newValue')
    assert.isFalse(@form.fields.name.valid)

  it 'validateCb returns false', ->
    @form.fields.name.setValidateCb(() -> false)
    @form.fields.name.handleChange('newValue')

    assert.isFalse(@form.fields.name.valid)
    assert.isUndefined(@form.fields.name.invalidMsg)
    assert.isFalse(@form.valid)
    assert.deepEqual(@form.invalidMessages, [])

  it 'validateCb cb returns message. It means an error', ->
    @form.fields.name.setValidateCb(() -> 'errorMsg')
    @form.fields.name.handleChange('newValue')

    assert.isFalse(@form.fields.name.valid)
    assert.equal(@form.fields.name.invalidMsg, 'errorMsg')
    assert.isFalse(@form.valid)
    assert.deepEqual(@form.invalidMessages, [{path: 'name', message: 'errorMsg'}])

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
