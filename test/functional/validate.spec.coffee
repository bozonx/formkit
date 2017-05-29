formHelper = require('../../src/index')

describe 'Functional. Validate.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

  it 'set validateCb on init', ->
    this.form = formHelper.newForm()
    this.form.init({name: {validate: () -> false}})

    this.form.fields.name.handleChange('newValue')
    assert.isFalse(this.form.fields.name.valid)

  it 'validateCb returns false', ->
    this.form.fields.name.setValidateCb(() -> false)
    this.form.fields.name.handleChange('newValue')

    assert.isFalse(this.form.fields.name.valid)
    assert.isUndefined(this.form.fields.name.invalidMsg)
    assert.isFalse(this.form.valid)
    assert.deepEqual(this.form.invalidMsgList, [{name: undefined}])

  it 'validateCb cb returns message', ->
    this.form.fields.name.setValidateCb(() -> 'errorMsg')
    this.form.fields.name.handleChange('newValue')

    assert.isFalse(this.form.fields.name.valid)
    assert.equal(this.form.fields.name.invalidMsg, 'errorMsg')
    assert.isFalse(this.form.valid)
    assert.deepEqual(this.form.invalidMsgList, [{name: 'errorMsg'}])

  it 'validateCb cb returns false and after that returns true', ->
    this.form.fields.name.setValidateCb((value) -> !!value)
    this.form.fields.name.handleChange(0)
    this.form.fields.name.handleChange(1)

    assert.isTrue(this.form.fields.name.valid)
    assert.isUndefined(this.form.fields.name.invalidMsg)
    assert.isTrue(this.form.valid)
    assert.deepEqual(this.form.invalidMsgList, [])
