formHelper = require('../../src/index')


describe 'Functional. saving.', ->
  describe 'field saving.', ->
    beforeEach () ->
      this.form = formHelper.newForm()
      this.form.init(['name'])
      this.saveHandler = sinon.spy();

    it 'save debounced after change value', ->
      this.form.onSave(this.formSaveHandler)
      this.form.fields.name.onSave(this.saveHandler)

      this.form.fields.name.handleChange('newValue')
      this.form.fields.name._debouncedCall.flush()

      assert.isFalse(this.form.fields.name.saving)

      expect(this.saveHandler).to.have.been.calledOnce
      expect(this.saveHandler).to.have.been.calledWith('newValue')

    it 'after change and pressing enter, value must save immediately and only last sase callback will be called', ->
      this.form.fields.name.onSave(this.saveHandler)
      this.form.fields.name.handleChange('newValue')
      this.form.fields.name.handlePressEnter()

      this.form.fields.name._debouncedCall.flush()

      expect(this.saveHandler).to.have.been.calledOnce
      expect(this.saveHandler).to.have.been.calledWith('newValue')

    it "don't save invalid value", ->
      this.form.setValidateCb((errors) -> errors.name = 'bad value')
      this.form.fields.name.onSave(this.saveHandler)
      this.form.fields.name.handleChange('newValue')
      this.form.fields.name._debouncedCall.flush()

      expect(this.saveHandler).to.have.not.been.called

    it 'after change value must save debounced', ->
      this.form.onSave(this.formSaveHandler)
      this.form.fields.name.onSave(this.saveHandler)
      this.form.fields.name.handleChange('newValue')
      this.form.fields.name._debouncedCall.flush()

    it "save callback returns a promise", ->
      startSaveHandler = sinon.spy()
      endSaveHandler = sinon.spy()
      handlerResolve = null
      saveHandler = () =>
        return new Promise (resolve) =>
          handlerResolve = resolve
      this.form.fields.name.onSave(saveHandler)
      this.form.fields.name.on('saveStart', startSaveHandler)
      this.form.fields.name.on('saveEnd', endSaveHandler)

      # change field's data
      #this.form.fields.name.handleChange('newValue')
      this.form.fields.name.setValue('newValue')
      # saving is false because the save cb is waiting for running
      assert.isFalse(this.form.fields.name.saving)
      # start saving by hands - it cancel previous save cb
      savePromise = this.form.fields.name.save()
      # saving is true after saving has started
      assert.isTrue(this.form.fields.name.saving)
      # resolve the save promise
      handlerResolve()

      savePromise.then () =>
        assert.isFalse(this.form.fields.name.saving)
        expect(startSaveHandler).to.have.been.calledOnce
        expect(endSaveHandler).to.have.been.calledOnce


  describe 'whole form saving.', ->
    beforeEach () ->
      this.form = formHelper.newForm()
      this.form.init(['param1', 'param2', 'param3'])
      this.formSaveHandler = sinon.spy();

    it 'save param1 and param3', ->
      this.form.onSave(this.formSaveHandler)

      this.form.fields.param1.handleChange('newValue1')
      this.form.fields.param3.handleChange('newValue3')

      this.form.fields.param1._debouncedCall.flush()
      this.form.fields.param3._debouncedCall.flush()

      this.form._events.flushFormSaving()

      expect(this.formSaveHandler).to.have.been.calledOnce
      expect(this.formSaveHandler).to.have.been.calledWith({
        param1: 'newValue1',
        param3: 'newValue3',
      })

    it "save callback returns a promise", ->
      startSaveHandler = sinon.spy()
      endSaveHandler = sinon.spy()
      handlerResolve = null
      saveHandler = () =>
        return new Promise (resolve) =>
          handlerResolve = resolve
      this.form.onSave(saveHandler)
      this.form.on('saveStart', startSaveHandler)
      this.form.on('saveEnd', endSaveHandler)

      this.form.fields.param1.handleChange('newValue')

      assert.isFalse(this.form.saving)

      this.form.fields.param1.cancelSaving()
      savePromise = this.form.save()

      assert.isTrue(this.form.saving)

      handlerResolve()

      savePromise.then () =>
        assert.isFalse(this.form.saving)
        expect(startSaveHandler).to.have.been.calledOnce
        expect(endSaveHandler).to.have.been.calledOnce
