formHelper = require('../../src/index').default

describe 'Functional. onChange and handleChange.', ->
  beforeEach () ->
    this.form = formHelper()
    this.form.init({name: null})

  it '', ->
    #this.form.fields.name.setValue('newValue')
