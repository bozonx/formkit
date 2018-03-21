formHelper = require('../../src/index')


describe 'Functional. saving.', ->
  describe 'field saving.', ->
    beforeEach () ->
      @form = formHelper.newForm()
      @form.init([ 'name' ])
      @field = @form.fields.name
      @saveHandler = sinon.spy();

    it 'save debounced after value had changed', ->
      @field.onSave(@saveHandler)
      @field.handleChange('newValue')
      # reset debounce
      @field.flushSaving()

      assert.isFalse(@field.saving)

      sinon.assert.calledOnce(@saveHandler)
      sinon.assert.calledWith(@saveHandler, 'newValue')

    it 'after change and pressing enter, value has to save immediately
             and only the last save callback will be called', ->
      @field.onSave(@saveHandler)
      @field.handleChange('newValue')
      @field.handlePressEnter()
      # it isn't really need but any way
      @field.flushSaving()

      sinon.assert.calledOnce(@saveHandler)
      sinon.assert.calledWith(@saveHandler, 'newValue')

    it "don't save invalid value", ->
      @form.setValidateCb((errors) -> errors.name = 'bad value')
      @field.onSave(@saveHandler)
      @field.handleChange('newValue')
      @field.flushSaving()

      sinon.assert.notCalled(@saveHandler)

    it "save callback returns a promise", ->
      startSaveHandler = sinon.spy()
      endSaveHandler = sinon.spy()
      handlerResolve = null
      saveHandler = () =>
        return new Promise (resolve) =>
          handlerResolve = resolve
      @field.onSave(saveHandler)
      @field.on('saveStart', startSaveHandler)
      @field.on('saveEnd', endSaveHandler)

      # change field's data
      @field.setValue('newValue')
      # saving is false because the save cb is waiting for running
      assert.isFalse(@field.saving)
      # start saving by hands - it cancel previous save cb
      savePromise = @field.save()
      # saving is true after saving has started
      assert.isTrue(@field.saving)
      # resolve the save promise
      handlerResolve()

      savePromise.then () =>
        assert.isFalse(@field.saving)
        sinon.assert.calledOnce(startSaveHandler)
        sinon.assert.calledOnce(endSaveHandler)


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
