formHelper = require('../../src/index').default

describe 'Functional. nestedFields.', ->
  describe 'field saving.', ->
    beforeEach () ->
      this.form = formHelper.newForm()

    it 'common', ->
      this.form.init({ 'nested.name': null })
#      assert.isNull(this.form.fields.nested.name.value)
#      assert.isNull(this.form.fields.nested.name.outerValue)

#      this.form.fields.nested.name.handleChange('newValue')
#      assert.isNull(this.form.fields.nested.name.value)
#      assert.isNull(this.form.fields.nested.name.outerValue)
      # TODO: событие
      # TODO: валидация
      # TODO: dirty
      # TODO: form
