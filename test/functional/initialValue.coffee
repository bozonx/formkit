formHelper = require('../../src/index').default

describe 'Functional. Init.', ->
  beforeEach () ->
    this.form = formHelper()

  it 'init - null', ->
    this.form.init({name: null})
    assert.isNull(this.form.fields.name.value)

  it 'init - initValue', ->
    this.form.init({name: 'initValue'})
    assert.equal(this.form.fields.name.value, 'initValue')
    assert.equal(this.form.fields.name.initialValue, 'initValue')

  it 'getInitialValues()', () ->
    this.form.setInitialValues({name: 'initValue'})
    assert.deepEqual(this.form.getInitialValues(), {name: 'initValue'})
    assert.equal(this.form.fields.name.value, 'initValue')

  it 'form\'s initialValues', () ->
    this.form.setInitialValues({name: 'initValue'})
    assert.equal(this.form.initialValues.name, 'initValue')
    assert.equal(this.form.fields.name.value, 'initValue')

# TODO: проверить - что уже установленно значение и устанавливаем новое
#       - тогда value не меняется, и сбрасывается dirty и touched
