formHelper = require('../../src/index')


describe 'Functional. Array.', ->
  beforeEach () ->
    @form = formHelper.newForm()
    @form.init([ 'name' ])

  it 'setting', ->
    value = [ 'item1', 'item2' ]
    @form.fields.name.setValue([ 'item1', 'item2', 'item3' ])
    @form.fields.name.handleChange(value)

    assert.deepEqual(@form.fields.name.value, value)

  it 'reducing', ->
    @form.fields.name.setValue(['item1', 'item2', 'item3'])
    @form.fields.name.handleChange(['item1', 'item2'])
    @form.fields.name.handleChange(['item2'])

    assert.deepEqual(@form.fields.name.value, ['item2'])
