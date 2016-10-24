formHelper = require('../../src/index').default

describe 'Functional. Primitive array Type.', ->
  beforeEach () ->
    this.form = formHelper()
    this.from.init(['name'])

  it 'initialValue', () ->

#    primitive = this.container.child('arrayParam')
#    assert.deepEqual(primitive.mold, [])
