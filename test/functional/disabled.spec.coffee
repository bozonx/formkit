formHelper = require('../../src/index')

describe 'Functional. Value.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

  it "disabled is false by default", ->
    assert.isFalse(this.form.fields.name.disabled)

  it "set disabled on field's init", ->
    this.form = formHelper.newForm()
    this.form.init({name: {disabled: true}})

    assert.isTrue(this.form.fields.name.disabled)

  it "set disabled", ->
    this.form.fields.name.setDisabled(true)
    assert.isTrue(this.form.fields.name.disabled)
