formkit = require('../../src/index')


describe 'Functional. onFocus.', ->
  beforeEach () ->
    this.form = formkit.newForm()
    this.form.init(['name'])

  it "update focus state", ->
    assert.isFalse(this.form.fields.name.focused)
    this.form.fields.name.handleFocusIn()
    assert.isTrue(this.form.fields.name.focused)
    this.form.fields.name.handleBlur()
    assert.isFalse(this.form.fields.name.focused)

  it "don't update user input on saved value change if field is on focus. config.allowFocusedFieldUpdating: false", ->
    this.form.fields.name.handleFocusIn()
    this.form.fields.name.handleChange('prevValue')
    this.form.setSavedValues({name: 'newerValue'})

    assert.equal(this.form.fields.name.value, 'prevValue')
    assert.isTrue(this.form.fields.name.dirty)

  it "update user input on saved value change if field is on focus. config.allowFocusedFieldUpdating: true", ->
    this.form.config.allowFocusedFieldUpdating = true
    this.form.fields.name.handleFocusIn()
    this.form.fields.name.handleChange('prevValue')
    this.form.setSavedValues({name: 'newerValue'})

    assert.equal(this.form.fields.name.value, 'newerValue')
    assert.isFalse(this.form.fields.name.dirty)
