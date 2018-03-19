Storage = require('../../src/Storage')
FieldStorage = require('../../src/FieldStorage')


describe 'Unit. FieldStorage.', ->
  beforeEach () ->
    @storage = new Storage()
    @fieldStorage = new FieldStorage(@storage)

  it "", ->
