Field = require('../../src/Field')


describe 'Unit. Field.', ->
  beforeEach () ->
    @form = {}
    @pathToField = 'path.to.field'
    #@field = new Field(@pathToField);

  it "_initState", ->
    # TODO: test - dirty должен быть false
    # TODO: test - должны подняться только storageChange события
