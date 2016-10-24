formHelper = require('../../src/index').default

describe 'Functional. Primitive array Type.', ->
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
