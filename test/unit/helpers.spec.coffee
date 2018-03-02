helpers = require('../../src/helpers')


describe 'Unit. helpers.', ->
  describe 'extendDeep.', ->
    it 'common', ->
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
