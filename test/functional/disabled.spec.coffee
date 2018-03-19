formHelper = require('../../src/index')


describe 'Functional. Disabled.', ->
  beforeEach () ->
    @form = formHelper.newForm()
    @form.init(['name'])

  it "disabled is false by default", ->

    assert.isFalse(@form.fields.name.disabled)

  it "set disabled on field's init", ->
    @form = formHelper.newForm()
    @form.init({ name: { disabled: true } })

    assert.isTrue(@form.fields.name.disabled)

  it "set disabled", ->
    @form.fields.name.setDisabled(true)
    assert.isTrue(@form.fields.name.disabled)
