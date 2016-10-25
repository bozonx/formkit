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

# TODO: get initialValues
# TODO: проверить - что уже установленно значение и устанавливаем новое
#       - тогда value не меняется, и сбрасывается dirty и touched
