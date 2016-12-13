formHelper = require('../../src/index').default

describe 'Functional. onBlur.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({name: null})

    this.fieldOnSaveHandler = sinon.spy();
    this.formOnSaveHandler = sinon.spy();

    this.form.fields.name.onSave(this.fieldOnSaveHandler);
    this.form.onSave(this.formOnSaveHandler);

  it "run handle blur if there is no one deleyed callback", ->
    this.form.fields.name.handleChange('newValue')
    this.form.fields.name.__debouncedCall.flush()
    this.form.$handlers.$debouncedCall.flush()
    assert.isFalse(this.form.fields.name.__debouncedCall.deleyed)
    this.form.fields.name.handleBlur()
    assert.isFalse(this.form.fields.name.__debouncedCall.deleyed)

    expect(this.fieldOnSaveHandler).to.have.been.calledOnce
    expect(this.formOnSaveHandler).to.have.been.calledOnce

  it "run handle blur if saving in progress", ->
    this.form.fields.name.handleChange('newValue')
    assert.isTrue(this.form.fields.name.__debouncedCall.deleyed)
    this.form.fields.name.handleBlur()
    assert.isFalse(this.form.fields.name.__debouncedCall.deleyed)

    expect(this.fieldOnSaveHandler).to.have.been.calledOnce
    expect(this.formOnSaveHandler).to.have.been.calledOnce
