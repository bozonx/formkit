formHelper = require('../../src/index').default

describe 'Functional. Events.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})

  describe 'change.', ->
    beforeEach () ->
      this.fieldHandler = sinon.spy();
      this.formHandler = sinon.spy();
      this.form.fields.name.on('change', this.fieldHandler);
      this.form.on('change', this.formHandler);

    it "after handleChange", ->
      this.form.fields.name.handleChange('newValue')
      expect(this.fieldHandler).to.have.been.calledOnce
      expect(this.fieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })
      expect(this.formHandler).to.have.been.calledOnce
      expect(this.formHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })

    it "after updateValue", () ->
      this.form.fields.name.updateValue('newValue')
      expect(this.fieldHandler).to.not.have.been.called
      expect(this.formHandler).to.not.have.been.calledOnce

    it "test oldValue", () ->
      this.form.fields.name.handleChange('initValue')
      this.form.fields.name.handleChange('newValue')
      expect(this.fieldHandler).to.have.been.calledTwice
      expect(this.fieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: 'initValue', value: 'newValue'
      })
      expect(this.formHandler).to.have.been.calledTwice
      expect(this.formHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: 'initValue', value: 'newValue'
      })

  describe 'silentChange.', ->
    beforeEach () ->
      this.fieldHandler = sinon.spy();
      this.formHandler = sinon.spy();
      this.form.fields.name.on('silentChange', this.fieldHandler);
      this.form.on('silentChange', this.formHandler);

    it "after handleChange", ->
      this.form.fields.name.handleChange('newValue')
      expect(this.fieldHandler).to.have.been.calledOnce
      expect(this.fieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })
      expect(this.formHandler).to.have.been.calledOnce
      expect(this.formHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })

    it "after updateValue", () ->
      this.form.fields.name.updateValue('newValue')
      expect(this.fieldHandler).to.have.been.calledOnce
      expect(this.fieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })
      expect(this.formHandler).to.have.been.calledOnce
      expect(this.formHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })

    it "test oldValue", () ->
      this.form.fields.name.updateValue('initValue')
      this.form.fields.name.updateValue('newValue')
      expect(this.fieldHandler).to.have.been.calledTwice
      expect(this.fieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: 'initValue', value: 'newValue'
      })
      expect(this.formHandler).to.have.been.calledTwice
      expect(this.formHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: 'initValue', value: 'newValue'
      })

  describe 'anyChange.', ->
    # TODO: недоделанно
    beforeEach () ->
      this.fieldHandler = sinon.spy();
      this.formHandler = sinon.spy();
      this.form.fields.name.on('anyChange', this.fieldHandler);
      this.form.on('anyChange', this.formHandler);

    it "after updateValue", () ->
      this.form.fields.name.updateValue('newValue')
      expect(this.fieldHandler).to.have.been.calledOnce
      expect(this.formHandler).to.have.been.calledOnce
