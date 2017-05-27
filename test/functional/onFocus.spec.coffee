formHelper = require('../../src/index')

describe 'Functional. onFocus.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

  it "update focus state", ->
    assert.isFalse(this.form.fields.name.focused)
    this.form.fields.name.handleFocusIn()
    assert.isTrue(this.form.fields.name.focused)
    this.form.fields.name.handleBlur()
    assert.isFalse(this.form.fields.name.focused)

  it "don't update user input on saved value change if field is on focus", ->
    this.form.fields.name.handleFocusIn()
    this.form.fields.name.handleChange('oldValue')
    this.form.setSavedValues({name: 'newerValue'})

    assert.equal(this.form.fields.name.value, 'oldValue')
    assert.isTrue(this.form.fields.name.dirty)
