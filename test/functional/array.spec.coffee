formHelper = require('../../src/index')

describe 'Functional. Submit.', ->
  beforeEach () ->
    this.form = formHelper.newForm()
    this.form.init({name: null})

  it 'setting', ->
    value = ['item1', 'item2']
    this.form.fields.name.setValue(['item1', 'item2', 'item3'])
    this.form.fields.name.handleChange(value)

    assert.deepEqual(this.form.fields.name.value, value)

  it 'reducing', ->
    this.form.fields.name.setValue(['item1', 'item2', 'item3'])
    this.form.fields.name.handleChange(['item1', 'item2'])
    this.form.fields.name.handleChange(['item2'])

    assert.deepEqual(this.form.fields.name.value, ['item2'])
