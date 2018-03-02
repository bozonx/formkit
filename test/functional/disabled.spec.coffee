formHelper = require('../../src/index')


describe 'Functional. Disabled.', ->
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
    anyFieldHandler = sinon.spy()
    anyFormHandler = sinon.spy()
    this.form.fields.name.on('anyChange', anyFieldHandler)
    this.form.on('anyChange', anyFormHandler)

    this.form.fields.name.setDisabled(true)
    assert.isTrue(this.form.fields.name.disabled)

    expect(anyFieldHandler).to.have.been.calledOnce
    expect(anyFormHandler).to.have.been.calledOnce
