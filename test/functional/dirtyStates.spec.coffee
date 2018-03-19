formHelper = require('../../src/index')


describe 'Functional. Dirty and touched states.', ->
  beforeEach () ->
    @form = formHelper.newForm()
    @form.init(['name'])

  it 'initial state of dirty and touched must be false', ->
    assert.isFalse(@form.fields.name.dirty)
    assert.isFalse(@form.fields.name.touched)
    assert.isFalse(@form.dirty)
    assert.isFalse(@form.touched)

  it 'initial state of dirty and touched must be false after setting saved value', ->
    @form.fields.name.setSavedValue('savedValue')
    assert.isFalse(@form.fields.name.dirty)
    assert.isFalse(@form.fields.name.touched)
    assert.isFalse(@form.dirty)
    assert.isFalse(@form.touched)

  it 'first value change. Dirty and touched must be true', ->
    @form.fields.name.handleChange('newValue')
    assert.isTrue(@form.fields.name.dirty)
    assert.isTrue(@form.fields.name.touched)
    assert.isTrue(@form.dirty)
    assert.isTrue(@form.touched)

  it 'set savedValue after user input', ->
    @form.fields.name.handleChange('newValue')
    @form.fields.name.setSavedValue('savedValue')
    assert.isFalse(@form.fields.name.dirty)
    assert.isTrue(@form.fields.name.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it 'set the same saved value', ->
    @form.fields.name.handleChange('newValue')
    @form.fields.name.setSavedValue('newValue')
    assert.isFalse(@form.fields.name.dirty)
    assert.isTrue(@form.fields.name.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it 'change and revert to first value', ->
    @form.fields.name.setSavedValue('initValue')
    @form.fields.name.handleChange('newValue')
    @form.fields.name.handleChange('initValue')
    assert.isFalse(@form.fields.name.dirty)
    assert.isTrue(@form.fields.name.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it 'after global setting values', ->
    @form.fields.name.handleChange('newValue')
    @form.setSavedValues({name: 'newValue'})
    assert.isFalse(@form.fields.name.dirty)
    assert.isTrue(@form.fields.name.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it "dirty state must be true if value reverted to ''", ->
    @form.fields.name.handleChange('newValue')
    @form.fields.name.handleChange('')
    assert.isFalse(@form.fields.name.dirty)
