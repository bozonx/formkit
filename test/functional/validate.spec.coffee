formHelper = require('../../src/index').default

describe 'Functional. Validate.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({ name: null })

  it 'validateCb returns false', ->
    this.form.fields.name.validateCb = () -> false
    this.form.fields.name.handleChange('newValue')

    assert.isFalse(this.form.fields.name.valid)
    assert.equal(this.form.fields.name.invalidMsg, '')
    assert.isFalse(this.form.valid)
    assert.deepEqual(this.form.invalidMsgs, {name: ''})

#  it 'validateCb cb returns message', ->
#    this.form.fields.name.validateCb = () -> 'errorMsg'
#    this.form.fields.name.handleChange('newValue')
#
#    assert.isFalse(this.form.fields.name.valid)
#    assert.equal(this.form.fields.name.invalidMsg, 'errorMsg')
#    assert.isFalse(this.form.valid)
#    #assert.deepEqual(this.form.invalidMsgs, {name: 'errorMsg'})
#
#  it 'validateCb cb returns true', ->
#    this.form.fields.name.validateCb = () -> true
#    this.form.fields.name.handleChange('newValue')
#
#    assert.isTrue(this.form.fields.name.valid)
#    assert.isNull(this.form.fields.name.invalidMsg)
#    assert.isTrue(this.form.valid)
#    #assert.deepEqual(this.form.invalidMsgs, {})
#
#  it 'validateCb cb returns error msg and after returns true', ->
#    this.form.fields.name.validateCb = (value) -> !!value
#    this.form.fields.name.handleChange(0)
#    this.form.fields.name.handleChange(1)
#
#    assert.isTrue(this.form.fields.name.valid)
#    assert.isNull(this.form.fields.name.invalidMsg)
#    assert.isTrue(this.form.valid)
#    #assert.deepEqual(this.form.invalidMsgs, {})
