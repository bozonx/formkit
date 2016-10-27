formHelper = require('../../src/index').default

describe 'Functional. Dirty and touched states.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})

  it 'initial state of dirty and touched', ->
    assert.isFalse(this.form.fields.name.dirty)
    assert.isFalse(this.form.fields.name.touched)
    assert.isFalse(this.form.dirty)
    assert.isFalse(this.form.touched)

  it 'initial state of dirty and touched after init value', ->
    this.form.fields.name.setInitialValue('initValue')
    assert.isFalse(this.form.fields.name.dirty)
    assert.isFalse(this.form.fields.name.touched)
    assert.isFalse(this.form.dirty)
    assert.isFalse(this.form.touched)

  it 'change value from null', ->
    this.form.fields.name.handleChange('newValue')
    assert.isTrue(this.form.fields.name.dirty)
    assert.isTrue(this.form.fields.name.touched)
    assert.isTrue(this.form.dirty)
    assert.isTrue(this.form.touched)

  it 'change value from initted value', ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.setInitialValue('initValue')
    assert.isTrue(this.form.fields.name.dirty)
    assert.isTrue(this.form.fields.name.touched)
    assert.isTrue(this.form.dirty)
    assert.isTrue(this.form.touched)

  it 'set the same initial value', ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.setInitialValue('newValue')
    assert.isFalse(this.form.fields.name.dirty)
    assert.isTrue(this.form.fields.name.touched)
    assert.isFalse(this.form.dirty)
    assert.isTrue(this.form.touched)

  it 'change and remove value', ->
    this.form.fields.name.setInitialValue('initValue')
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.handleChange('initValue')
    assert.isFalse(this.form.fields.name.dirty)
    assert.isTrue(this.form.fields.name.touched)
    assert.isFalse(this.form.dirty)
    assert.isTrue(this.form.touched)

  it 'after global setting initial values', ->
    this.form.setInitialValues({name: 'newValue'})
    assert.isFalse(this.form.fields.name.dirty)
    assert.isFalse(this.form.fields.name.touched)
    assert.isFalse(this.form.dirty)
    assert.isFalse(this.form.touched)

  it 'after global setting values', ->
    this.form.setValues({name: 'newValue'})
    assert.isTrue(this.form.fields.name.dirty)
    assert.isFalse(this.form.fields.name.touched)
    assert.isTrue(this.form.dirty)
    assert.isFalse(this.form.touched)

  it "dirty state must be true if value reverted to ''", ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.handleChange('')
    assert.isFalse(this.form.fields.name.dirty)
