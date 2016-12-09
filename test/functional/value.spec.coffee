formHelper = require('../../src/index').default

describe 'Functional. Value.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({name: null})

  it "set new value to field. outerValue == undefined and value has new value", ->
    this.form.fields.name.handleChange('newValue')

    assert.equal(this.form.fields.name.value, 'newValue')
    assert.isNull(this.form.fields.name.outerValue)

    assert.equal(this.form.$storage.getValue('name'), 'newValue')
    assert.equal(this.form.$storage.getUserInput('name'), 'newValue')
    assert.isNull(this.form.$storage.getOuterValue('name'))

  it "set new value to field. Initial isn't change but value has new value", ->
    this.form.init({name: 'initValue'})
    this.form.fields.name.handleChange('newValue')

    assert.equal(this.form.fields.name.value, 'newValue')
    assert.equal(this.form.fields.name.outerValue, 'initValue')

    assert.equal(this.form.$storage.getValue('name'), 'newValue')
    assert.equal(this.form.$storage.getUserInput('name'), 'newValue')
    assert.equal(this.form.$storage.getOuterValue('name'), 'initValue')

  it 'set new outer value', ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.value = 'newOuterValue'

    assert.deepEqual(this.form.values, {name: 'newOuterValue'})
    assert.equal(this.form.fields.name.value, 'newOuterValue')
    assert.equal(this.form.fields.name.outerValue, 'newOuterValue')

    assert.equal(this.form.$storage.getValue('name'), 'newOuterValue')
    assert.isUndefined(this.form.$storage.getUserInput('name'))
    assert.equal(this.form.$storage.getOuterValue('name'), 'newOuterValue')

  it 'set new values to whole form (machine update)', ->
    this.form.fields.name.handleChange('newValue')
    this.form.values = {name: 'newOuterValue'}

    assert.deepEqual(this.form.values, {name: 'newOuterValue'})
    assert.equal(this.form.fields.name.value, 'newOuterValue')
    assert.equal(this.form.fields.name.outerValue, 'newOuterValue')

    assert.equal(this.form.$storage.getValue('name'), 'newOuterValue')
    assert.isUndefined(this.form.$storage.getUserInput('name'))
    assert.equal(this.form.$storage.getOuterValue('name'), 'newOuterValue')
