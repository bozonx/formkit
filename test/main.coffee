# main file for tests

chai = require('chai')
sinon = require("sinon")
sinonChai = require('sinon-chai')
chaiAsPromised = require('chai-as-promised')
chai.use(sinonChai)
chai.use(chaiAsPromised)
require('mocha-sinon')

global.assert = chai.assert
global.expect = chai.expect
global.sinon = sinon

global._ = require('lodash')
