formHelper = require('../../src/index').default

describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})
    this.formOnChangeHandler = sinon.spy();
    this.nameFiledOnChangeHandler = sinon.spy();
    this.form.onChange(this.formOnChangeHandler);
    this.form.fields.name.onChange(this.nameFiledOnChangeHandler);

  it "field's onChange handler must be called after handleChange", ->
    this.form.fields.name.handleChange('newValue')
    expect(this.nameFiledOnChangeHandler).to.have.been.calledOnce
    expect(this.nameFiledOnChangeHandler).to.have.been.calledWith('newValue')

  it "form's onChange handler must be called after handleChange", ->
    this.form.fields.name.handleChange('newValue')
    expect(this.formOnChangeHandler).to.have.been.calledOnce
    expect(this.formOnChangeHandler).to.have.been.calledWith({name: 'newValue'})

  it "it doesn\'t rise events on set initial values", ->
    this.form.fields.name.setInitialValue('initialValue')
    expect(this.formOnChangeHandler).to.not.have.been.called

# TODO: события навешанные на изменения пользователя не должны отрабатывать при машинном изменении
