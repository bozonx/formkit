formHelper = require('../../src/index')


describe.only 'Functional. saving.', ->
  describe 'field saving.', ->
    beforeEach () ->
      @form = formHelper.newForm()
      @form.init([ 'name' ])
      @saveHandler = sinon.spy();

    it 'save debounced after change value', ->
      @form.onSave(@formSaveHandler)
      @form.fields.name.onSave(@saveHandler)

      @form.fields.name.handleChange('newValue')
      @form.fields.name._debouncedCall.flush()

      assert.isFalse(@form.fields.name.saving)

      expect(@saveHandler).to.have.been.calledOnce
      expect(@saveHandler).to.have.been.calledWith('newValue')

    it 'after change and pressing enter, value must save immediately and only last sase callback will be called', ->
      @form.fields.name.onSave(@saveHandler)
      @form.fields.name.handleChange('newValue')
      @form.fields.name.handlePressEnter()

      @form.fields.name._debouncedCall.flush()

      expect(@saveHandler).to.have.been.calledOnce
      expect(@saveHandler).to.have.been.calledWith('newValue')

    it "don't save invalid value", ->
      @form.setValidateCb((errors) -> errors.name = 'bad value')
      @form.fields.name.onSave(@saveHandler)
      @form.fields.name.handleChange('newValue')
      @form.fields.name._debouncedCall.flush()

      expect(@saveHandler).to.have.not.been.called

    it 'after change value must save debounced', ->
      @form.onSave(@formSaveHandler)
      @form.fields.name.onSave(@saveHandler)
      @form.fields.name.handleChange('newValue')
      @form.fields.name._debouncedCall.flush()

    it "save callback returns a promise", ->
      startSaveHandler = sinon.spy()
      endSaveHandler = sinon.spy()
      handlerResolve = null
      saveHandler = () =>
        return new Promise (resolve) =>
          handlerResolve = resolve
      @form.fields.name.onSave(saveHandler)
      @form.fields.name.on('saveStart', startSaveHandler)
      @form.fields.name.on('saveEnd', endSaveHandler)

      # change field's data
      #@form.fields.name.handleChange('newValue')
      @form.fields.name.setValue('newValue')
      # saving is false because the save cb is waiting for running
      assert.isFalse(@form.fields.name.saving)
      # start saving by hands - it cancel previous save cb
      savePromise = @form.fields.name.save()
      # saving is true after saving has started
      assert.isTrue(@form.fields.name.saving)
      # resolve the save promise
      handlerResolve()

      savePromise.then () =>
        assert.isFalse(@form.fields.name.saving)
        expect(startSaveHandler).to.have.been.calledOnce
        expect(endSaveHandler).to.have.been.calledOnce


  describe 'whole form saving.', ->
    beforeEach () ->
      @form = formHelper.newForm()
      @form.init(['param1', 'param2', 'param3'])
      @formSaveHandler = sinon.spy();

    it 'save param1 and param3', ->
      @form.onSave(@formSaveHandler)

      @form.fields.param1.handleChange('newValue1')
      @form.fields.param3.handleChange('newValue3')

      @form.fields.param1._debouncedCall.flush()
      @form.fields.param3._debouncedCall.flush()

      @form._events.flushFormSaving()

      expect(@formSaveHandler).to.have.been.calledOnce
      expect(@formSaveHandler).to.have.been.calledWith({
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
      @form.onSave(saveHandler)
      @form.on('saveStart', startSaveHandler)
      @form.on('saveEnd', endSaveHandler)

      @form.fields.param1.handleChange('newValue')

      assert.isFalse(@form.saving)

      @form.fields.param1.cancelSaving()
      savePromise = @form.save()

      assert.isTrue(@form.saving)

      handlerResolve()

      savePromise.then () =>
        assert.isFalse(@form.saving)
        expect(startSaveHandler).to.have.been.calledOnce
        expect(endSaveHandler).to.have.been.calledOnce
