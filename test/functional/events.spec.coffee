formHelper = require('../../src/index')

describe 'Functional. Events.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({name: null})

  describe 'change.', ->
    beforeEach () ->
      this.silentFieldHandler = sinon.spy();
      this.silentFormHandler = sinon.spy();
      this.fieldHandler = sinon.spy();
      this.formHandler = sinon.spy();
      this.anyFieldHandler = sinon.spy();
      this.anyFormHandler = sinon.spy();

      this.form.fields.name.on('silentChange', this.silentFieldHandler);
      this.form.on('silentChange', this.silentFormHandler);
      this.form.fields.name.on('change', this.fieldHandler);
      this.form.on('change', this.formHandler);
      this.form.fields.name.on('anyChange', this.anyFieldHandler);
      this.form.on('anyChange', this.anyFormHandler);

    it "after user input", ->
      this.form.fields.name.handleChange('newValue')
      # user change
      expect(this.fieldHandler).to.have.been.calledOnce
      expect(this.fieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })
      expect(this.formHandler).to.have.been.calledOnce
      expect(this.formHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'newValue'
      })
      # silent
      expect(this.silentFieldHandler).to.have.not.been.called
      expect(this.silentFormHandler).to.have.not.been.called
      # any change
      expect(this.anyFieldHandler).to.have.been.calledOnce
      expect(this.anyFormHandler).to.have.been.calledOnce

    it "after outer update", () ->
      this.form.fields.name.value = 'outerValue'
      # user change
      expect(this.fieldHandler).to.not.have.been.called
      expect(this.formHandler).to.not.have.been.called
      # silent
      expect(this.silentFieldHandler).to.have.been.calledOnce
      expect(this.silentFieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'outerValue'
      })
      expect(this.silentFormHandler).to.have.been.calledOnce
      expect(this.silentFormHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: null, value: 'outerValue'
      })
      # any change
      expect(this.anyFieldHandler).to.have.been.calledOnce
      expect(this.anyFormHandler).to.have.been.calledOnce
