formkit = require('../../src/index')

describe 'Functional. Events.', ->
  describe 'change.', ->
    beforeEach () ->
      this.form = formkit.newForm()
      this.form.init(['name'])

      this.silentFieldHandler = sinon.spy();
      this.silentFormHandler = sinon.spy();
      this.fieldHandler = sinon.spy();
      this.formHandler = sinon.spy();
      this.anyFieldHandler = sinon.spy();
      this.anyFormHandler = sinon.spy();

      this.form.fields.name.on('silentChange', this.silentFieldHandler);
      this.form.on('silentChange', this.silentFormHandler);
      #this.form.fields.name.on('change', this.fieldHandler);
      this.form.fields.name.onChange(this.fieldHandler);
      this.form.on('change', this.formHandler);
      this.form.fields.name.on('anyChange', this.anyFieldHandler);
      this.form.on('anyChange', this.anyFormHandler);

    it "after user input", ->
      this.form.fields.name.handleChange('newValue')
      # user change
      expect(this.fieldHandler).to.have.been.calledOnce
      expect(this.fieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: undefined , value: 'newValue'
      })
      expect(this.formHandler).to.have.been.calledOnce
      expect(this.formHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: undefined, value: 'newValue'
      })
      # silent
      expect(this.silentFieldHandler).to.have.not.been.called
      expect(this.silentFormHandler).to.have.not.been.called
      # any change
      expect(this.anyFieldHandler).to.have.been.calledOnce
      expect(this.anyFormHandler).to.have.been.calledOnce

    it "after set saved", () ->
      this.form.fields.name.setSavedValue('savedValue')
      # user change
      expect(this.fieldHandler).to.not.have.been.called
      expect(this.formHandler).to.not.have.been.called
      # silent
      expect(this.silentFieldHandler).to.have.been.calledOnce
      expect(this.silentFieldHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: undefined, value: 'savedValue'
      })
      expect(this.silentFormHandler).to.have.been.calledOnce
      expect(this.silentFormHandler).to.have.been.calledWith({
        fieldName: 'name', oldValue: undefined, value: 'savedValue'
      })
      # any change
      expect(this.anyFieldHandler).to.have.been.calledOnce
      expect(this.anyFormHandler).to.have.been.calledOnce
