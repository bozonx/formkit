helpers = require('../../src/helpers')


describe 'Unit. helpers.', ->
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

  it 'extendDeep.', ->
    willExtend = {
      a: 1,
      c: 1,
      d: {
        d1: 11,
        d3: 11,
      },
    }
    newValues = {
      a: 2,
      b: 2,
      d: {
        d1: 22,
        d2: 22,
      },
      e: {
        e1: 22,
      },
    }

    result = {
      a: 2,
      b: 2,
      c: 1,
      d: {
        d1: 22,
        d2: 22,
        d3: 11,
      },
      e: {
        e1: 22,
      },
    }

    commandResult = helpers.extendDeep(willExtend, newValues)

    assert.deepEqual(commandResult, result)
    assert.deepEqual(willExtend, result)
    assert.deepEqual(newValues, newValues)
