formHelper = require('../../src/index')

describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

    this.fieldOnChangeHandler = sinon.spy();
    this.formOnChangeHandler = sinon.spy();
    this.fieldOnSaveHandler = sinon.spy();
    this.formOnSaveHandler = sinon.spy();

    this.form.fields.name.onChange(this.fieldOnChangeHandler);
    this.form.onChange(this.formOnChangeHandler);
    this.form.fields.name.onSave(this.fieldOnSaveHandler);
    this.form.onSave(this.formOnSaveHandler);

  it "call after setValue", ->
    this.form.fields.name.handleChange('userValue')
    expect(this.fieldOnChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnChangeHandler).to.have.been.calledWith({ fieldName: "name", oldValue: undefined, value: "userValue" })

    expect(this.formOnChangeHandler).to.have.been.calledOnce
    expect(this.formOnChangeHandler).to.have.been.calledWith({name: 'userValue'})

  it "don't call after machine update", ->
    this.form.fields.name.setValue('machineValue')
    expect(this.fieldOnChangeHandler).to.not.have.been.called

    expect(this.formOnChangeHandler).to.not.have.been.called

  it "it doesn't rise events on set initial values", ->
    this.form.fields.name.setValue('initialValue')
    expect(this.fieldOnChangeHandler).to.not.have.been.called

    expect(this.formOnChangeHandler).to.not.have.been.called

  it "call after uncahnged value if this.form.config.allowSaveUnmodifiedField = true", ->
    this.form.config.allowSaveUnmodifiedField = true;
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.handleChange('userValue')

    this.form.fields.name.flushSaving();
    this.form.flushSaving();

    expect(this.fieldOnChangeHandler).to.have.been.calledTwice
    expect(this.formOnChangeHandler).to.have.been.calledTwice
    expect(this.fieldOnSaveHandler).to.have.been.calledOnce
    expect(this.formOnSaveHandler).to.have.been.calledOnce

  it "dont call after uncahnged value if this.form.config.allowSaveUnmodifiedField = false", ->
    this.form.config.allowSaveUnmodifiedField = false;
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.handleChange('userValue')

    this.form.fields.name.flushSaving();
    this.form.flushSaving();

    expect(this.fieldOnChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnChangeHandler).to.have.been.calledWith({ fieldName: "name", oldValue: undefined, value: "userValue" })

    expect(this.formOnChangeHandler).to.have.been.calledOnce
    expect(this.formOnChangeHandler).to.have.been.calledWith({name: 'userValue'})

    expect(this.fieldOnSaveHandler).to.have.been.calledOnce
    expect(this.formOnSaveHandler).to.have.been.calledOnce

  it "don't do anything if disabled", ->
    this.form.fields.name.handleChange('oldValue')
    this.form.fields.name.setDisabled(true)
    this.form.fields.name.handleChange('newValue')
    assert.equal(this.form.fields.name.value, 'oldValue')
