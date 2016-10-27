formHelper = require('../../src/index').default

describe 'Functional. Init.', ->
  beforeEach () ->
    this.form = formHelper()

  it 'init - null', ->
    this.form.init({name: null})
    assert.isNull(this.form.fields.name.value)

  it 'init - initValue', ->
    this.form.init({name: 'initValue'})
    assert.equal(this.form.fields.name.value, 'initValue')
    assert.equal(this.form.fields.name.initialValue, 'initValue')

    assert.equal(this.form.$storage.getFieldValue('name'), 'initValue')
    assert.equal(this.form.$storage.getFieldInitialValue('name'), 'initValue')

  it 'init after set value', ->
    this.form.init({name: 'initValue'})
    this.form.fields.name.handleChange('newValue')

    assert.equal(this.form.fields.name.value, 'newValue')
    assert.equal(this.form.fields.name.initialValue, 'initValue')

    assert.equal(this.form.$storage.getFieldValue('name'), 'newValue')
    assert.equal(this.form.$storage.getFieldInitialValue('name'), 'initValue')

  it 'getInitialValues()', () ->
    this.form.setInitialValues({name: 'initValue'})
    assert.deepEqual(this.form.getInitialValues(), {name: 'initValue'})
    assert.equal(this.form.fields.name.value, 'initValue')
    assert.equal(this.form.$storage.getFieldValue('name'), 'initValue')

  it 'form\'s initialValues', () ->
    this.form.setInitialValues({name: 'initValue'})
    assert.equal(this.form.fields.name.value, 'initValue')
    assert.equal(this.form.initialValues.name, 'initValue')

    assert.equal(this.form.$storage.getFieldValue('name'), 'initValue')
    assert.equal(this.form.$storage.getFieldInitialValue('name'), 'initValue')
