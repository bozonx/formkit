formkit = require('../../src/index')


describe 'Functional. saving.', ->
  describe 'field saving.', ->
    beforeEach () ->
      @form = formkit.newForm()
      @form.init([ 'name' ])
      @field = @form.fields.name
      @savePromise = Promise.resolve()
      @saveHandler = sinon.stub().returns(@savePromise)

    it.only 'save debounced after value had changed', ->
      saveStartHandler = sinon.spy()
      saveEndHandler = sinon.spy()
      @form.onSave(@saveHandler)
      @form.on('saveStart', saveStartHandler)
      @form.on('saveEnd', saveEndHandler)
      @field.handleChange('newValue')

      assert.isUndefined(@field.savedValue)
      assert.equal(@field.editedValue, 'newValue')

      sinon.assert.notCalled(saveStartHandler)
      sinon.assert.notCalled(saveEndHandler)

      # reset debounce
      @form.flushSaving()

      sinon.assert.calledOnce(saveStartHandler)
      sinon.assert.notCalled(saveEndHandler)
      assert.isTrue(@form.saving)

      @saveHandler
        .then =>
          sinon.assert.calledOnce(saveStartHandler)
          sinon.assert.calledOnce(saveEndHandler)
          assert.isFalse(@form.saving)
          sinon.assert.calledOnce(@saveHandler)
          sinon.assert.calledWith(@saveHandler, 'newValue')

          assert.equal(@field.savedValue, 'newValue')
          assert.isUndefined(@field.editedValue)

    it 'after change and pressing enter, value has to save immediately
        and only the last save callback will be called', ->
      @field.onSave(@saveHandler)
      @field.handleChange('newValue')
      @field.handleEndEditing()
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
      formStartSaveHandler = sinon.spy()
      formEndSaveHandler = sinon.spy()
      fieldStartSaveHandler = sinon.spy()
      fieldEndSaveHandler = sinon.spy()
      handlerResolve = null
      saveHandler = () =>
        return new Promise (resolve) =>
          handlerResolve = resolve
      @field.onSave(saveHandler)
      @form.on('saveStart', formStartSaveHandler)
      @form.on('saveEnd', formEndSaveHandler)
      @field.on('saveStart', fieldStartSaveHandler)
      @field.on('saveEnd', fieldEndSaveHandler)

      # change field's data
      @field.setValue('newValue')
      # saving is false because the save cb is waiting for running
      assert.isFalse(@form.saving)
      assert.isFalse(@field.saving)

      # start saving by hands - it cancel previous save cb
      savePromise = @field.save()

      # saving is true after saving has started
      assert.isTrue(@form.saving)
      assert.isTrue(@field.saving)
      sinon.assert.calledOnce(formStartSaveHandler)
      sinon.assert.calledOnce(fieldStartSaveHandler)

      # resolve the save promise
      handlerResolve()

      savePromise.then () =>
        assert.isFalse(@form.saving)
        assert.isFalse(@field.saving)
        sinon.assert.calledOnce(formEndSaveHandler)
        sinon.assert.calledOnce(fieldEndSaveHandler)
