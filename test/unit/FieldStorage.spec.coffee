Storage = require('../../src/Storage')
FieldStorage = require('../../src/FieldStorage')


describe.only 'Unit. FieldStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @fieldStorage = new FieldStorage(@storage)

  it "", ->
