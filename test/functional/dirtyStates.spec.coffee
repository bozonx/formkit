formkit = require('../../src/formkit')


describe 'Functional. Dirty and touched states.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init(['name'])
    @field = @form.fields.name

  it 'initial state of dirty and touched must be false', ->
    assert.isFalse(@field.dirty)
    assert.isFalse(@field.touched)
    assert.isFalse(@form.dirty)
    assert.isFalse(@form.touched)

  it 'initial state of dirty and touched must be false after setting saved value', ->
    @field.setSavedValue('savedValue')
    assert.isFalse(@field.dirty)
    assert.isFalse(@field.touched)
    assert.isFalse(@form.dirty)
    assert.isFalse(@form.touched)

  it 'first value change. Dirty and touched must be true', ->
    @field.handleChange('newValue')
    assert.isTrue(@field.dirty)
    assert.isTrue(@field.touched)
    assert.isTrue(@form.dirty)
    assert.isTrue(@form.touched)

  it 'set savedValue after user input', ->
    @field.handleChange('newValue')
    @form.flushSaving()
    @field.setSavedValue('savedValue')

    assert.isFalse(@field.dirty)
    assert.isTrue(@field.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it 'set the same saved value', ->
    @field.handleChange('newValue')
    @field.setSavedValue('newValue')
    assert.isFalse(@field.dirty)
    assert.isTrue(@field.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it 'change and revert to first value', ->
    @field.setSavedValue('initValue')
    @field.handleChange('newValue')
    @field.handleChange('initValue')
    assert.isFalse(@field.dirty)
    assert.isTrue(@field.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it 'after global setting values', ->
    @field.handleChange('newValue')
    @form.setSavedValues({name: 'newValue'})
    assert.isFalse(@field.dirty)
    assert.isTrue(@field.touched)
    assert.isFalse(@form.dirty)
    assert.isTrue(@form.touched)

  it "dirty state must be true if value reverted to ''", ->
    @field.handleChange('newValue')
    @field.handleChange('')
    assert.isFalse(@field.dirty)
