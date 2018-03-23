helpers = require('../../src/helpers')


describe 'Unit. helpers.', ->
  it "findFieldRecursively", ->
    class Field
      constructor: ->

    field = new Field()
    obj = {
      parent: {
        field: field
      }
    }
    cb = sinon.spy()

    helpers.findFieldRecursively(obj, cb)

    sinon.assert.calledOnce(cb)
    sinon.assert.calledWith(cb, field, 'parent.field')
#
#  it 'extendDeep.', ->
#    willExtend = {
#      a: 1,
#      c: 1,
#      d: {
#        d1: 11,
#        d3: 11,
#      },
#    }
#    newValues = {
#      a: 2,
#      b: 2,
#      d: {
#        d1: 22,
#        d2: 22,
#      },
#      e: {
#        e1: 22,
#      },
#    }
#
#    result = {
#      a: 2,
#      b: 2,
#      c: 1,
#      d: {
#        d1: 22,
#        d2: 22,
#        d3: 11,
#      },
#      e: {
#        e1: 22,
#      },
#    }
#
#    commandResult = helpers.extendDeep(willExtend, newValues)
#
#    assert.deepEqual(commandResult, result)
#    assert.deepEqual(willExtend, result)
#    assert.deepEqual(newValues, newValues)

  describe "findRecursively", ->
    it "deep.", ->
      cb = sinon.spy()
      obj = {
        path: {
          to: {
            param: 1
          }
        }
      }

      helpers.findRecursively(obj, cb)

      sinon.assert.calledThrice(cb)

    it "stop on found.", ->
      cb = sinon.stub().returns(true)
      obj = {
        field1: {
          param: 1
        }
        field2: {
          param: 1
        }
      }

      helpers.findRecursively(obj, cb)

      sinon.assert.calledOnce(cb)
      sinon.assert.calledWith(cb, { param: 1 }, 'field1')

    it "don't go deeper on returns false.", ->
      cb = sinon.stub().returns(false)
      obj = {
        field1: {
          param: {
            deeperParam: 1
          }
        }
        field2: {
          param: 1
        }
      }

      helpers.findRecursively(obj, cb)

      sinon.assert.calledTwice(cb)

  it "calculateDirty", ->
    assert.isTrue( helpers.calculateDirty('newValue', 'oldValue') )
    assert.isTrue( helpers.calculateDirty('newValue', undefined) )

    assert.isFalse( helpers.calculateDirty(undefined, 'oldValue') )
    assert.isFalse( helpers.calculateDirty('value', 'value') )
    assert.isFalse( helpers.calculateDirty(undefined, undefined) )

    assert.isFalse( helpers.calculateDirty(undefined, null) )
    assert.isFalse( helpers.calculateDirty(undefined, '') )

  it "getFieldName", ->
    assert.equal( helpers.getFieldName('path.to.field'), 'field')
    assert.equal( helpers.getFieldName('field'), 'field')
