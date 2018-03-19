Storage = require('../../src/Storage')
FormStorage = require('../../src/FormStorage')


describe.only 'Unit. FieldStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @formStorage = new FormStorage(@storage)

  it "get and set state", ->
