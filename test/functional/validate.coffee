formHelper = require('../../src/index').default

describe 'Functional. Validate.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({
      name: null,
      #surname: null,
    })

  it 'validateRule cb returns false', ->
    this.form.fields.name.validateRule = () -> false
    this.form.fields.name.handleChange('newValue')

    assert.isFalse(this.form.fields.name.valid)
    assert.equal(this.form.fields.name.invalidMsg, '')
    assert.isFalse(this.form.valid)
    assert.deepEqual(this.form.invalidMsg, {name: ''})

  it 'validateRule cb returns message', ->
    this.form.fields.name.validateRule = () -> 'errorMsg'
    this.form.fields.name.handleChange('newValue')

    assert.isFalse(this.form.fields.name.valid)
    assert.equal(this.form.fields.name.invalidMsg, 'errorMsg')
    assert.isFalse(this.form.valid)
    assert.deepEqual(this.form.invalidMsg, {name: 'errorMsg'})

  it 'validateRule cb returns true', ->
    this.form.fields.name.validateRule = () -> true
    this.form.fields.name.handleChange('newValue')

    assert.isTrue(this.form.fields.name.valid)
    assert.isNull(this.form.fields.name.invalidMsg)
    assert.isTrue(this.form.valid)
    assert.deepEqual(this.form.invalidMsg, {})

  it 'validateRule cb returns error msg and after returns true', ->
    this.form.fields.name.validateRule = (value) -> !!value
    this.form.fields.name.handleChange(0)
    this.form.fields.name.handleChange(1)

    assert.isTrue(this.form.fields.name.valid)
    assert.isNull(this.form.fields.name.invalidMsg)
    assert.isTrue(this.form.valid)
    assert.deepEqual(this.form.invalidMsg, {})
