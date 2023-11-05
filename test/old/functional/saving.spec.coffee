formkit = require('../../src/formkit')


describe 'Functional. saving.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init([ 'name' ])
    @field = @form.fields.name
    @saveHandler = sinon.stub().returns(Promise.resolve())

  it "canSave and savable - not valid form", ->
    @form.setValidateCb((errors) -> errors.name = 'bad value')
    @field.handleChange('newValue')

    assert.isFalse(@form.savable)
    assert.isString(@form.canSave())

  it "canSave and savable - form isn't changed", ->
    assert.isFalse(@form.savable)
    assert.isString(@form.canSave())

  it "canSave and savable - saveable", ->
    @field.handleChange('newValue')
    assert.isTrue(@form.savable)
    assert.isUndefined(@form.canSave())

  it 'save debounced after value had changed', ->
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

    @form.saveControl.getSavePromise()
      .then =>
        sinon.assert.calledOnce(saveStartHandler)
        sinon.assert.calledOnce(saveEndHandler)
        assert.isFalse(@form.saving)
        sinon.assert.calledOnce(@saveHandler)
        sinon.assert.calledWith(@saveHandler, { name: 'newValue' })

        assert.equal(@field.savedValue, 'newValue')
        assert.isUndefined(@field.editedValue)

  it 'after change and pressing enter, form will be flushed', ->
    @form.onSave(@saveHandler)
    @field.handleChange('newValue')
    @field.handleEndEditing()

    @form.saveControl.getSavePromise()
      .then =>
        sinon.assert.calledOnce(@saveHandler)
