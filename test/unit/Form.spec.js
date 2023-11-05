import {newForm} from '../../src/formkit.js'


describe('unit/From', () => {
  it('deduplicate', () => {
    const form = newForm({})
    console.log(11, form)

    assert.deepEqual(1, form)
  })

})
