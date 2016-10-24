formHelper = require('../../src/index').default

describe 'Functional. Common.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init(['name'])

  it 'initialValue', () ->
    assert.isNull(this.form.fields.name.value)
    this.form.setInitialValues({name: 'newValue'})
    assert.equal(this.form.fields.name.value, 'newValue')

  it 'set value', () ->
    assert.isNull(this.form.fields.name.value)
    this.form.fields.name.setValue('newValue')
    assert.equal(this.form.fields.name.value, 'newValue')

  it 'getValues', () ->
    assert.isNull(this.form.getValues().name)
    this.form.fields.name.setValue('newValue')
    assert.equal(this.form.getValues().name, 'newValue')
