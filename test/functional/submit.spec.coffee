formHelper = require('../../src/index').default

describe 'Functional. Submit.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({name: null})

  it 'simple submit', ->
    this.submitHandler = sinon.spy();
    this.form.onSubmit(this.submitHandler)

    this.form.fields.name.handleChange('newValue')
    this.form.handleSubmit()
    expect(this.submitHandler).to.have.been.calledOnce
    expect(this.submitHandler).to.have.been.calledWith({name: 'newValue'})
    assert.equal(this.form.submitting, false)

  it 'submitting with promise', (done) ->
    this.submitHandler = () ->
      return new Promise (resolve) =>
        resolve()

    this.form.onSubmit(this.submitHandler)

    this.form.fields.name.handleChange('newValue')

    handleSubmitReturn = this.form.handleSubmit()
    assert.equal(this.form.submitting, true)

    expect(handleSubmitReturn).to.eventually.notify =>
      assert.equal(this.form.submitting, false)
      done()

  it 'rejected promise', (done) ->
    this.submitHandler = ->
      new Promise (resolve, reject) =>
        reject('error')

    this.form.onSubmit(this.submitHandler)

    this.form.fields.name.handleChange('newValue')

    handleSubmitReturn = this.form.handleSubmit()
    assert.isTrue(this.form.submitting)

    Promise.all([
      expect(handleSubmitReturn).to.eventually.rejected.and.equal('error'),
      expect(handleSubmitReturn).to.eventually.rejected.and.notify =>
        assert.isFalse(this.form.submitting)
        done()
    ]);

  it "don't submit while form is submitting at the moment", (done) ->
    this.resolver = null;
    this.submitHandler = () =>
      new Promise (resolve) =>
        this.resolver = () => resolve()

    this.form.onSubmit(this.submitHandler)

    this.form.fields.name.handleChange('newValue')

    handleSubmitReturn = this.form.handleSubmit()
    assert.isTrue(this.form.submitting)

    # run second time
    this.form.fields.name.handleChange('newValue2')
    this.form.onSubmit()
    assert.isTrue(this.form.submitting)

    this.resolver()

    expect(handleSubmitReturn).to.eventually.notify =>
      assert.isFalse(this.form.submitting)
      done()


  # TODO: test - не сохранять если данные не изменились
