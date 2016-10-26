formHelper = require('../../src/index').default

describe 'Functional. Validate.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({ name: null })

  it '', ->
    this.form.fields.name.handleChange('newValue')
