formHelper = require('../../src/index').default

describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})

    this.fieldOnChangeHandler = sinon.spy();
    this.fieldOnAnyChangeHandler = sinon.spy();
    this.formOnChangeHandler = sinon.spy();
    this.formOnAnyChangeHandler = sinon.spy();

    this.form.fields.name.onChange(this.fieldOnChangeHandler);
    this.form.fields.name.onAnyChange(this.fieldOnAnyChangeHandler);
    this.form.onChange(this.formOnChangeHandler);
    this.form.onAnyChange(this.formOnAnyChangeHandler);

  it "call after userInput", ->
    this.form.fields.name.handleChange('userValue')
    expect(this.fieldOnChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnChangeHandler).to.have.been.calledWith('userValue')
    expect(this.fieldOnAnyChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnAnyChangeHandler).to.have.been.calledWith('userValue')

    expect(this.formOnChangeHandler).to.have.been.calledOnce
    expect(this.formOnChangeHandler).to.have.been.calledWith({name: 'userValue'})
    expect(this.formOnAnyChangeHandler).to.have.been.calledOnce
    expect(this.formOnAnyChangeHandler).to.have.been.calledWith({name: 'userValue'})

  it "don't call after machine update", ->
    this.form.fields.name.updateValue('machineValue')
    expect(this.fieldOnChangeHandler).to.not.have.been.called
    expect(this.fieldOnAnyChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnAnyChangeHandler).to.have.been.calledWith('machineValue')

    expect(this.formOnChangeHandler).to.not.have.been.called
    expect(this.formOnAnyChangeHandler).to.have.been.calledOnce
    expect(this.formOnAnyChangeHandler).to.have.been.calledWith({name: 'machineValue'})

  it "it doesn\'t rise events on set initial values", ->
    this.form.fields.name.setInitialValue('initialValue')
    expect(this.fieldOnChangeHandler).to.not.have.been.called
    expect(this.fieldOnAnyChangeHandler).to.have.been.calledOnce
    expect(this.fieldOnAnyChangeHandler).to.have.been.calledWith('initialValue')

    expect(this.formOnChangeHandler).to.not.have.been.called
    expect(this.formOnAnyChangeHandler).to.have.been.calledOnce
    expect(this.formOnAnyChangeHandler).to.have.been.calledWith({name: 'initialValue'})
