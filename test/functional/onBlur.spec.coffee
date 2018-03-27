formkit = require('../../src/index')


describe 'Functional. onBlur.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init(['name'])

    @fieldOnSaveHandler = sinon.spy();

    @form.fields.name.onSave(@fieldOnSaveHandler);

  it "run handle blur if there is no one delayed callback", ->
    @form.fields.name.setValue('newValue')

    assert.isFalse(@form.fields.name._debouncedCall.getDelayed())
    @form.fields.name.handleBlur()
    assert.isFalse(@form.fields.name._debouncedCall.getDelayed())

    expect(@fieldOnSaveHandler).to.have.been.calledOnce

  it "run handle blur if saving in progress", ->
    @form.fields.name.handleChange('newValue')
    assert.isTrue(@form.fields.name._debouncedCall.getDelayed())
    @form.fields.name.handleBlur()

    assert.isFalse(@form.fields.name._debouncedCall.getDelayed())

    expect(@fieldOnSaveHandler).to.have.been.calledOnce
