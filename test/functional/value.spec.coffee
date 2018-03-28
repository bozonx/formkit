formkit = require('../../src/index')


describe 'Functional. Value, saved value, default value.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init(['name'])
    @field = @form.fields.name
    @handleFieldStorageChange = sinon.spy()
    @handleFormStorageChange = sinon.spy()

  it "set new value to field. savedValue == undefined and value has new value", ->
    @field.handleChange('false')

    assert.equal(@field.value, false)
    assert.isUndefined(@field.savedValue)

  it "set initial value", ->
    form = formkit.newForm()
    form.init({ name: { initial: 'true' } })

    assert.equal(form.fields.name.value, true)
    assert.isUndefined(form.fields.name.savedValue)

  it "set new saved value", ->
    @field.handleChange('newValue')
    @field.setSavedValue('newSavedValue')

    assert.deepEqual(@form.values, { name: 'newSavedValue' })
    assert.equal(@field.value, 'newSavedValue')
    assert.equal(@field.savedValue, 'newSavedValue')

  it "set new values to whole form (machine update)", ->
    @field.handleChange('newValue')
    @form.setSavedValues({name: 'newSavedValue'})

    assert.deepEqual(@form.values, {name: 'newSavedValue'})
    assert.equal(@field.value, 'newSavedValue')
    assert.equal(@field.savedValue, 'newSavedValue')

  it "set defaultValue on init", ->
    form = formkit.newForm()
    form.init({
      name: { defaultValue: 'false' }
    })

    assert.deepEqual(form.values, { name: false })
    assert.equal(form.fields.name.value, false)
    assert.equal(form.fields.name.defaultValue, false)
    assert.isUndefined(form.fields.name.savedValue)

  it "initial value has more priority", ->
    form = formkit.newForm()
    form.init({name: {
      defaultValue: 'default value',
      initial: 'initial value',
    }})

    assert.equal(form.fields.name.value, 'initial value')

  it "form.setValues", ->
    form = formkit.newForm()
    form.init(['parent.child'])

    form.setValues({
      parent: { child: 'newValue' }
    })

    assert.deepEqual(form.values, {
      parent: { child: 'newValue' }
    })

  it "form.setSavedValues", ->
    form = formkit.newForm()
    form.init(['parent.child'])

    form.setSavedValues({
      parent: { child: 'newValue' }
    })

    assert.deepEqual(form.savedValues, {
      parent: { child: 'newValue' }
    })

  describe "revert, clear, reset", ->
    beforeEach () ->
      @form = formkit.newForm()
      @form.init([ 'field1', 'field2' ])
      @field1 = @form.fields.field1
      @field2 = @form.fields.field2

    it "reset field to defaultValue", ->
      @field1.$setStateSilent({ defaultValue: 'default value' })
      @field1.handleChange('value')
      @field1.on('storage', @handleFieldStorageChange)

      @field1.reset()

      assert.equal(@field1.value, 'default value')
      assert.isTrue(@field1.dirty)
      sinon.assert.calledOnce(@handleFieldStorageChange)

    it "reset form", ->
      @field1.$setStateSilent({ defaultValue: 5 })
      @field1.handleChange('value')
      @field2.handleChange('value')
      @form.on('storage', @handleFormStorageChange)

      @form.reset()

      assert.deepEqual(@form.values, {
        field1: 5
        field2: undefined
      })
      # TODO: не понимается так как combined value не часть form state
      #sinon.assert.calledOnce(@handleFormStorageChange)

    it "revert user input of field", ->
      @field1.setSavedValue('savedValue')
      @field1.handleChange('userValue')
      @field1.on('storage', @handleFieldStorageChange)

      @field1.revert()

      assert.equal(@field1.value, 'savedValue')
      assert.isFalse(@field1.dirty)
      sinon.assert.calledOnce(@handleFieldStorageChange)

    it "revert user input of form", ->
      @field1.setSavedValue('savedValue')
      @field1.handleChange('userValue')
      @field2.handleChange('userValue')
      @form.on('storage', @handleFormStorageChange)

      @form.revert()

      assert.deepEqual(@form.values, {
        field1: 'savedValue'
        field2: undefined
      })
      # TODO: не понимается так как combined value не часть form state
      #sinon.assert.calledOnce(@handleFormStorageChange)

    it "clear user input of field", ->
      @field1.$setStateSilent({ initial: 5 })
      @field1.setSavedValue('savedValue')
      @field1.handleChange('value')
      @field1.on('storage', @handleFieldStorageChange)

      @field1.clear()

      assert.equal(@field1.value, 5)
      assert.isTrue(@field1.dirty)
      sinon.assert.calledOnce(@handleFieldStorageChange)

    it "clear form", ->
      @field1.$setStateSilent({ initial: 5 })
      @field1.setSavedValue('savedValue')
      @field1.handleChange('value')
      @field2.handleChange('value')
      @form.on('storage', @handleFormStorageChange)

      @form.clear()

      assert.deepEqual(@form.values, {
        field1: 5
        field2: undefined
      })
      # TODO: не понимается так как combined value не часть form state
      #sinon.assert.calledOnce(@handleFormStorageChange)
