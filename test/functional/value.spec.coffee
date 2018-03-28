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
      form = formkit.newForm()
      form.init({name: {defaultValue: 'default value'}})

      form.fields.name.handleChange('userValue')
      form.fields.name.reset();

      assert.deepEqual(form.values, {name: 'default value'})
      assert.equal(form.fields.name.value, 'default value')
      assert.equal(form.fields.name.defaultValue, 'default value')
      assert.isUndefined(form.fields.name.savedValue)
      assert.isTrue(form.fields.name.touched)
      # saved value = undefined and value = "default value" - dirty = true
      assert.isTrue(form.fields.name.dirty)

    it "reset form", ->
      form = formkit.newForm()
      form.init({name: {defaultValue: 'default value'}})

      form.fields.name.handleChange('userValue')
      form.reset();

      assert.deepEqual(form.values, {name: 'default value'})
      assert.equal(form.fields.name.value, 'default value')
      assert.equal(form.fields.name.defaultValue, 'default value')
      assert.isUndefined(form.fields.name.savedValue)
      assert.isTrue(form.fields.name.touched)
      # saved value = undefined and value = "default value" - dirty = true
      assert.isTrue(form.fields.name.dirty)

    it "revert user input of field", ->
      @field1.setSavedValue('savedValue')
      @field1.handleChange('userValue')
      @form.setValidateCb((errors) -> errors.field1 = 'bad value')
      @field1.revert()

      assert.equal(@field1.value, 'savedValue')
      assert.isFalse(@field1.dirty)
      assert.isFalse(@field1.valid)
      assert.equal(@field1.invalidMsg, 'bad value')

    it "revert user input of form", ->
      @field1.setSavedValue('savedValue')
      @field1.handleChange('userValue')
      @form.setValidateCb((errors) -> errors.field1 = 'bad value')
      @form.revert()

      assert.equal(@field1.value, 'savedValue')
      assert.isFalse(@field1.dirty)
      assert.isFalse(@field1.valid)
      assert.equal(@field1.invalidMsg, 'bad value')

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
      @field1.on('storage', @handleFieldStorageChange)
      @form.on('storage', @handleFormStorageChange)

      @form.clear()

      assert.deepEqual(@form.values, {
        field1: 5
        field2: undefined
      })
      sinon.assert.calledOnce(@handleFormStorageChange)
      sinon.assert.calledOnce(@handleFieldStorageChange)
