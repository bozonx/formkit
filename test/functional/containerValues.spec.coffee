formkit = require('../../src/formkit')


describe 'Functional. containerValues.', ->
  beforeEach () ->
    @form = formkit.newForm()
    @form.init([ 'name' ])

  it 'Plain objects - set new shorter object - it has to replace', ->
    newValue = {
      id: 1
    }
    @form.fields.name.setValue({
      id: 2
      name: 'value'
    })
    @form.fields.name.handleChange(newValue)

    assert.deepEqual(@form.fields.name.value, newValue)

  it 'Arrays - set new shorter array', ->
    newValue = [ 'item1', 'item2' ]
    @form.fields.name.setValue([ 'item1', 'item2', 'item3' ])
    @form.fields.name.handleChange(newValue)

    assert.deepEqual(@form.fields.name.value, newValue)

  it 'Arrays - reducing', ->
    @form.fields.name.setValue(['item1', 'item2', 'item3'])
    @form.fields.name.handleChange(['item1', 'item2'])
    @form.fields.name.handleChange(['item2'])

    assert.deepEqual(@form.fields.name.value, ['item2'])

  it 'Arrays - has to be immutable', ->
    arr = [
      {
        param: 1
      }
    ]
    @form.fields.name.setValue(arr)

    assert.notEqual(@form.fields.name.value[0], arr[0])
    assert.notEqual(@form.fields.name.editedValue[0], arr[0])
