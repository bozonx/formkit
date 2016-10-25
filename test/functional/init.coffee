formHelper = require('../../src/index').default

describe 'Functional. Common.', ->
  beforeEach () ->
    this.form = formHelper()

  it 'init - null', () ->
    this.form.init({name: null})
    assert.isNull(this.form.fields.name.value)

  it 'init - initValue', () ->
    this.form.init({name: 'initValue'})
    assert.equal(this.form.fields.name.value, 'initValue')
    assert.equal(this.form.fields.name.initialValue, 'initValue')
