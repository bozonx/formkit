import {newForm} from '../../src/formkit.js'


describe('unit/From', () => {
  it('init as array', () => {
    const form = newForm()

    form.init([ 'field1', 'parent.field2' ])

    assert.deepEqual(form.values, {
      field1: undefined,
      parent: {
        field2: undefined
      }
    })
  })

})
