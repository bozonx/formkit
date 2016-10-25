formHelper = require('../../src/index').default

describe 'Functional. Set value.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})

  it 'set new value to field. initial = null', ->
    this.form.fields.name.setValue('newValue')
    assert.equal(this.form.fields.name.value, 'newValue')
    assert.equal(this.form.fields.name.initialValue, null)

  it 'set new value to field. initial = initValue', ->
    this.form.init({name: 'initValue'})
    this.form.fields.name.setValue('newValue')
    assert.equal(this.form.fields.name.value, 'newValue')
    assert.equal(this.form.fields.name.initialValue, 'initValue')

  it 'set new values to whore form', ->
    this.form.setValues({name: 'newValue'})
    assert.deepEqual(this.form.values, {name: 'newValue'})
    assert.deepEqual(this.form.initialValues, {name: null})
    assert.equal(this.form.fields.name.value, 'newValue')
    assert.equal(this.form.fields.name.initialValue, null)

#  it 'getValues', () ->
#    assert.isNull(this.form.getValues().name)
#    this.form.fields.name.setValue('newValue')
#    assert.equal(this.form.getValues().name, 'newValue')
