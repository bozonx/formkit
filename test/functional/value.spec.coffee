formHelper = require('../../src/index')

describe 'Functional. Value, saved value, default value.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

  it "set new value to field. savedValue == undefined and value has new value", ->
    this.form.fields.name.handleChange('newValue')

    assert.equal(this.form.fields.name.value, 'newValue')
    assert.isUndefined(this.form.fields.name.savedValue)

    assert.equal(this.form._storage.getValue('name'), 'newValue')
    assert.isUndefined(this.form._storage.getFieldState('name', 'savedValue'))

  it "set initial value", ->
    this.form = formHelper.newForm()
    this.form.init({name: {initial: 'initValue'}})

    assert.equal(this.form.fields.name.value, 'initValue')
    assert.isUndefined(this.form.fields.name.savedValue)

    assert.equal(this.form._storage.getValue('name'), 'initValue')
    assert.isUndefined(this.form._storage.getFieldState('name', 'savedValue'))

  it "set new saved value", ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.setSavedValue('newSavedValue')

    assert.deepEqual(this.form.values, {name: 'newSavedValue'})
    assert.equal(this.form.fields.name.value, 'newSavedValue')
    assert.equal(this.form.fields.name.savedValue, 'newSavedValue')

    assert.equal(this.form._storage.getValue('name'), 'newSavedValue')
    assert.equal(this.form._storage.getFieldState('name', 'savedValue'), 'newSavedValue')

  it "set new values to whole form (machine update)", ->
    this.form.fields.name.handleChange('newValue')
    this.form.setSavedValues({name: 'newSavedValue'})

    assert.deepEqual(this.form.values, {name: 'newSavedValue'})
    assert.equal(this.form.fields.name.value, 'newSavedValue')
    assert.equal(this.form.fields.name.savedValue, 'newSavedValue')

    assert.equal(this.form._storage.getValue('name'), 'newSavedValue')
    assert.equal(this.form._storage.getFieldState('name', 'savedValue'), 'newSavedValue')

  it "clear user input of field", ->
    this.form.fields.name.setSavedValue('savedValue')
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.setValidateCb(() -> 'bad value')
    this.form.fields.name.clear()

    assert.equal(this.form.fields.name.value, 'savedValue')
    assert.isFalse(this.form.fields.name.dirty)
    assert.isFalse(this.form.fields.name.valid)
    assert.equal(this.form.fields.name.invalidMsg, 'bad value')

  it "clear user input of form", ->
    this.form.fields.name.setSavedValue('savedValue')
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.setValidateCb(() -> 'bad value')
    this.form.clear()

    assert.equal(this.form.fields.name.value, 'savedValue')
    assert.isFalse(this.form.fields.name.dirty)
    assert.isFalse(this.form.fields.name.valid)
    assert.equal(this.form.fields.name.invalidMsg, 'bad value')

  it "set defaultValue on init", ->
    this.form = formHelper.newForm()
    this.form.init({name: {defaultValue: 'default value'}})

    assert.deepEqual(this.form.values, {name: 'default value'})
    assert.equal(this.form.fields.name.value, 'default value')
    assert.equal(this.form.fields.name.defaultValue, 'default value')
    assert.isUndefined(this.form.fields.name.savedValue)

  it "initial value has more priority", ->
    this.form = formHelper.newForm()
    this.form.init({name: {
      defaultValue: 'default value',
      initial: 'initial value',
    }})

    assert.equal(this.form.fields.name.value, 'initial value')

  it "reset field to defaultValue", ->
    this.form = formHelper.newForm()
    this.form.init({name: {defaultValue: 'default value'}})

    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.reset();

    assert.deepEqual(this.form.values, {name: 'default value'})
    assert.equal(this.form.fields.name.value, 'default value')
    assert.equal(this.form.fields.name.defaultValue, 'default value')
    assert.isUndefined(this.form.fields.name.savedValue)
    assert.isTrue(this.form.fields.name.touched)
    # saved value = undefined and value = "default value" - dirty = true
    assert.isTrue(this.form.fields.name.dirty)

  it "reset form", ->
    this.form = formHelper.newForm()
    this.form.init({name: {defaultValue: 'default value'}})

    this.form.fields.name.handleChange('userValue')
    this.form.reset();

    assert.deepEqual(this.form.values, {name: 'default value'})
    assert.equal(this.form.fields.name.value, 'default value')
    assert.equal(this.form.fields.name.defaultValue, 'default value')
    assert.isUndefined(this.form.fields.name.savedValue)
    assert.isTrue(this.form.fields.name.touched)
    # saved value = undefined and value = "default value" - dirty = true
    assert.isTrue(this.form.fields.name.dirty)

  it "form.setValues", ->
    this.form = formHelper.newForm()
    this.form.init(['parent.child'])

    this.form.setValues({
      parent: { child: 'newValue' }
    })

    assert.deepEqual(this.form.values, {
      parent: { child: 'newValue' }
    })

  it "form.setSavedValues", ->
    this.form = formHelper.newForm()
    this.form.init(['parent.child'])

    this.form.setSavedValues({
      parent: { child: 'newValue' }
    })

    assert.deepEqual(this.form.savedValues, {
      parent: { child: 'newValue' }
    })
