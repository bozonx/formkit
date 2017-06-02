formHelper = require('../../src/index')

describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init(['name'])

    this.fieldOnChangeHandler = sinon.spy();
    this.formOnChangeHandler = sinon.spy();

    this.form.fields.name.onChange(this.fieldOnChangeHandler);
    this.form.onChange(this.formOnChangeHandler);

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

  it "call after uncahnged value if this.form.config.allowSaveUnchanged = true", ->
    this.form.config.allowSaveUnchanged = true;
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.handleChange('userValue')

    expect(this.fieldOnChangeHandler).to.have.been.calledTwice
    expect(this.formOnChangeHandler).to.have.been.calledTwice

  it "dont call after uncahnged value if this.form.config.allowSaveUnchanged = false", ->
    this.form.config.allowSaveUnchanged = false;
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.handleChange('userValue')
    expect(this.fieldOnChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnChangeHandler).to.have.been.calledWith({ fieldName: "name", oldValue: undefined, value: "userValue" })

    expect(this.formOnChangeHandler).to.have.been.calledOnce
    expect(this.formOnChangeHandler).to.have.been.calledWith({name: 'userValue'})

  it "don't do anything if disabled", ->
    this.form.fields.name.handleChange('oldValue')
    this.form.fields.name.setDisabled(true)
    this.form.fields.name.handleChange('newValue')
    assert.equal(this.form.fields.name.value, 'oldValue')
