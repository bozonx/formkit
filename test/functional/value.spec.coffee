formHelper = require('../../src/index')

describe 'Functional. Value.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

  it "set new value to field. savedValue == undefined and value has new value", ->
    this.form.fields.name.handleChange('newValue')

    assert.equal(this.form.fields.name.value, 'newValue')
    assert.isNull(this.form.fields.name.savedValue)

    assert.equal(this.form.$storage.getValue('name'), 'newValue')
    assert.equal(this.form.$storage.getUserInput('name'), 'newValue')
    assert.isNull(this.form.$storage.getSavedValue('name'))

  it "set new value to field. Initial isn't change but value has new value", ->
    this.form.init({name: {initial: 'initValue'}})
    this.form.fields.name.handleChange('newValue')

    assert.equal(this.form.fields.name.value, 'newValue')
    assert.equal(this.form.fields.name.savedValue, 'initValue')

    assert.equal(this.form.$storage.getValue('name'), 'newValue')
    assert.equal(this.form.$storage.getUserInput('name'), 'newValue')
    assert.equal(this.form.$storage.getSavedValue('name'), 'initValue')

  it "set new outer value", ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.setValue('newSavedValue')

    assert.deepEqual(this.form.values, {name: 'newSavedValue'})
    assert.equal(this.form.fields.name.value, 'newSavedValue')
    assert.equal(this.form.fields.name.savedValue, 'newSavedValue')

    assert.equal(this.form.$storage.getValue('name'), 'newSavedValue')
    assert.isUndefined(this.form.$storage.getUserInput('name'))
    assert.equal(this.form.$storage.getSavedValue('name'), 'newSavedValue')

  it "set new values to whole form (machine update)", ->
    this.form.fields.name.handleChange('newValue')
    this.form.setValues({name: 'newSavedValue'})

    assert.deepEqual(this.form.values, {name: 'newSavedValue'})
    assert.equal(this.form.fields.name.value, 'newSavedValue')
    assert.equal(this.form.fields.name.savedValue, 'newSavedValue')

    assert.equal(this.form.$storage.getValue('name'), 'newSavedValue')
    assert.isUndefined(this.form.$storage.getUserInput('name'))
    assert.equal(this.form.$storage.getSavedValue('name'), 'newSavedValue')

  it "reset user input", ->
    this.form.fields.name.setValue('savedValue')
    this.form.fields.name.handleChange('newValue')
    this.form.clearUserInput()

    assert.equal(this.form.fields.name.value, 'savedValue')
    assert.isUndefined(this.form.fields.name.userInput)
    assert.isFalse(this.form.fields.name.dirty)

