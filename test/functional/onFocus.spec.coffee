formHelper = require('../../src/index').default

describe 'Functional. onBlur.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({name: null})

  it "update focus state", ->
    assert.isFalse(this.form.fields.name.focused)
    this.form.fields.name.handleFocusIn()
    assert.isTrue(this.form.fields.name.focused)
    this.form.fields.name.handleBlur()
    assert.isFalse(this.form.fields.name.focused)
