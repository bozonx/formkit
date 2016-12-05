formHelper = require('../../src/index').default

describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({name: null})

    this.fieldOnChangeHandler = sinon.spy();
    this.formOnChangeHandler = sinon.spy();

    this.form.fields.name.onChange(this.fieldOnChangeHandler);
    this.form.onChange(this.formOnChangeHandler);

  it "call after userInput", ->
    this.form.fields.name.handleChange('userValue')
    expect(this.fieldOnChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnChangeHandler).to.have.been.calledWith('userValue')

    expect(this.formOnChangeHandler).to.have.been.calledOnce
    expect(this.formOnChangeHandler).to.have.been.calledWith({name: 'userValue'})

  it "don't call after machine update", ->
    this.form.fields.name.updateValue('machineValue')
    expect(this.fieldOnChangeHandler).to.not.have.been.called

    expect(this.formOnChangeHandler).to.not.have.been.called

  it "it doesn\'t rise events on set initial values", ->
    this.form.fields.name.setInitialValue('initialValue')
    expect(this.fieldOnChangeHandler).to.not.have.been.called

    expect(this.formOnChangeHandler).to.not.have.been.called

  it "call after uncahnged value if this.form.$config.unchangedValueSaving = true", ->
    this.form.$config.unchangedValueSaving = true;
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.handleChange('userValue')

    expect(this.fieldOnChangeHandler).to.have.been.calledTwice
    expect(this.formOnChangeHandler).to.have.been.calledTwice

  it "dont call after uncahnged value if this.form.$config.unchangedValueSaving = false", ->
    this.form.$config.unchangedValueSaving = false;
    this.form.fields.name.handleChange('userValue')
    this.form.fields.name.handleChange('userValue')
    expect(this.fieldOnChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnChangeHandler).to.have.been.calledWith('userValue')

    expect(this.formOnChangeHandler).to.have.been.calledOnce
    expect(this.formOnChangeHandler).to.have.been.calledWith({name: 'userValue'})
