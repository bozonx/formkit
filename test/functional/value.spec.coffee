formHelper = require('../../src/index')

describe 'Functional. Value.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

  it "set new value to field. savedValue == undefined and value has new value", ->
    this.form.fields.name.handleChange('newValue')

    assert.equal(this.form.fields.name.value, 'newValue')
    assert.isUndefined(this.form.fields.name.savedValue)

    assert.equal(this.form.$storage.getValue('name'), 'newValue')
    assert.isUndefined(this.form.$storage.getSavedValue('name'))

  it "set initial value", ->
    this.form = formHelper.newForm()
    this.form.init({name: {initial: 'initValue'}})

    assert.equal(this.form.fields.name.value, 'initValue')
    assert.isUndefined(this.form.fields.name.savedValue)

    assert.equal(this.form.$storage.getValue('name'), 'initValue')
    assert.isUndefined(this.form.$storage.getSavedValue('name'))

  it "set new saved value", ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.setSavedValue('newSavedValue')

    assert.deepEqual(this.form.values, {name: 'newSavedValue'})
    assert.equal(this.form.fields.name.value, 'newSavedValue')
    assert.equal(this.form.fields.name.savedValue, 'newSavedValue')

    assert.equal(this.form.$storage.getValue('name'), 'newSavedValue')
    assert.equal(this.form.$storage.getSavedValue('name'), 'newSavedValue')

  it "set new values to whole form (machine update)", ->
    this.form.fields.name.handleChange('newValue')
    this.form.setSavedValues({name: 'newSavedValue'})

    assert.deepEqual(this.form.values, {name: 'newSavedValue'})
    assert.equal(this.form.fields.name.value, 'newSavedValue')
    assert.equal(this.form.fields.name.savedValue, 'newSavedValue')

    assert.equal(this.form.$storage.getValue('name'), 'newSavedValue')
    assert.equal(this.form.$storage.getSavedValue('name'), 'newSavedValue')

  it "clear user input of field", ->
    this.form.fields.name.setSavedValue('savedValue')
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.clear()

    assert.equal(this.form.fields.name.value, 'savedValue')
    assert.isFalse(this.form.fields.name.dirty)

  it "clear user input of form", ->
    this.form.fields.name.setSavedValue('savedValue')
    this.form.fields.name.handleChange('userValue')
    this.form.clear()

    assert.equal(this.form.fields.name.value, 'savedValue')
    assert.isFalse(this.form.fields.name.dirty)
