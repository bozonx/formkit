formHelper = require('../../src/index').default

describe 'Functional. nestedFields.', ->
  describe 'field saving.', ->
    beforeEach () ->
      this.form = formHelper.newForm()
      this.form.init({ 'nested.name': null })

    it 'initial values', ->
      assert.isNull(this.form.fields.nested.name.value)
      assert.isNull(this.form.fields.nested.name.outerValue)

    it 'user input', ->
      this.form.fields.nested.name.handleChange('newValue')
      assert.equal(this.form.fields.nested.name.value, 'newValue')
      assert.isNull(this.form.fields.nested.name.outerValue)
      assert.isTrue(this.form.fields.nested.name.dirty)
      assert.isTrue(this.form.fields.nested.name.touched)

      assert.deepEqual(this.form.values, {nested: {name: 'newValue'}})
      assert.isTrue(this.form.dirty)
      assert.isTrue(this.form.touched)

    it 'outer change', ->
      this.form.fields.nested.name.value = 'outerValue'
      assert.equal(this.form.fields.nested.name.value, 'outerValue')
      assert.equal(this.form.fields.nested.name.outerValue, 'outerValue')

      assert.deepEqual(this.form.values, {nested: {name: 'outerValue'}})

    it 'validation', ->


      # TODO: событие
      # TODO: валидация

