formHelper = require('../../src/index').default

describe 'Functional. saving.', ->
  describe 'field saving.', ->
    beforeEach () ->
      this.form = formHelper.newForm()
      this.form.init({ name: null })
      this.saveHandler = sinon.spy();

    it 'after change value must save debounced', ->
        this.form.onSave(this.formSaveHandler)
        this.form.fields.name.onSave(this.saveHandler)
        this.form.fields.name.handleChange('newValue')
        this.form.fields.name._debouncedCb.flush()

        expect(this.saveHandler).to.have.been.calledOnce
        expect(this.saveHandler).to.have.been.calledWith('newValue')

      it 'after change and pressing enter, value must save immediately and queue must be cancelled', ->
        this.form.fields.name.onSave(this.saveHandler)
        this.form.fields.name.handleChange('newValue')
        this.form.fields.name.handlePressEnter()

        expect(this.saveHandler).to.have.been.calledOnce
        expect(this.saveHandler).to.have.been.calledWith('newValue')

        this.form.fields.name._debouncedCb.flush()

        expect(this.saveHandler).to.have.been.calledOnce
        expect(this.saveHandler).to.have.been.calledWith('newValue')

      it 'dont\'t save invalid value', ->
        this.form.fields.name.validateRule = () -> false
        this.form.fields.name.onSave(this.saveHandler)
        this.form.fields.name.handleChange('newValue')
        this.form.fields.name._debouncedCb.flush()

        expect(this.saveHandler).to.not.have.been.called

      it 'after change value must save debounced', ->
        this.form.onSave(this.formSaveHandler)
        this.form.fields.name.onSave(this.saveHandler)
        this.form.fields.name.handleChange('newValue')
        this.form.fields.name._debouncedCb.flush()

  describe 'whole form saving.', ->
    beforeEach () ->
      this.form = formHelper.newForm()
      this.form.init({ param1: null, param2: null, param3: null })
      this.formSaveHandler = sinon.spy();

#    it 'save partly', ->
#      this.form.onSave(this.formSaveHandler)
#      this.form.fields.param1.handleChange('newValue')
#      this.form.fields.param1._debouncedCb.flush()
#      this.form.fields.param3.handleChange('newValue')
#      this.form.fields.param3._debouncedCb.flush()
#
#      expect(this.formSaveHandler).to.have.been.calledOnce
#      expect(this.formSaveHandler).to.have.been.calledWith({
#        param1: 'newValue',
#        param2: 'newValue',
#      })
