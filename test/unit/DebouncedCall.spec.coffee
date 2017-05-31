DebouncedCall = require('../../src/DebouncedCall').default

describe 'Unit. DebouncedCall.', ->
  beforeEach () ->
    this.debounced = new DebouncedCall(300);

#    this.firstPromise = new Promise (resolve, reject) =>
#      this.firstPromiseResolve = resolve
#      this.firstPromiseReject = reject

    this.promisedHandler = undefined;
    this.firstPromiseResolve = undefined;
    this.firstPromiseReject = undefined;
    this.promisedValue = undefined;

    this.simpleHandler = undefined;
    this.simpleValue = undefined;

    this.promisedHandler = (value) =>
      return new Promise (resolve, reject) =>
        this.firstPromiseResolve = () =>
          this.promisedValue = value;
          resolve()
        this.firstPromiseReject = reject

    this.simpleHandler = (value) =>
      this.simpleValue = value;


  it "set simple callback force - check statuses and result", ->
    assert.isFalse(this.debounced.getDelayed())
    assert.isFalse(this.debounced.getPending())

    this.debounced.exec(this.simpleHandler, true, 'simpleValue')

    assert.isFalse(this.debounced.getDelayed())
    assert.isFalse(this.debounced.getPending())
    assert.equal(this.simpleValue, 'simpleValue')

  it "set simple callback force - check promise", ->
    promise = this.debounced.exec(this.simpleHandler, true, 'simpleValue')

    promise.then () =>
      assert.isFalse(this.debounced.getDelayed())
      assert.isFalse(this.debounced.getPending())
      assert.equal(this.simpleValue, 'simpleValue')

  it "set simple callback delayed", ->
    promise = this.debounced.exec(this.simpleHandler, false, 'simpleValue')
    this.debounced.flush();

    promise.then () =>
      assert.isFalse(this.debounced.getDelayed())
      assert.isFalse(this.debounced.getPending())
      assert.equal(this.simpleValue, 'simpleValue')


  it "set promised callback force", ->
    promise = this.debounced.exec(this.promisedHandler, true, 'promisedValue')
    this.firstPromiseResolve();

    promise.then () =>
      assert.isFalse(this.debounced.getDelayed())
      assert.isFalse(this.debounced.getPending())
      assert.equal(this.promisedValue, 'promisedValue')


  it "set promised callback delayed", () ->
    promise = this.debounced.exec(this.promisedHandler, false, 'promisedValue')
    this.debounced.flush();
    this.firstPromiseResolve();

    promise.then () =>
      assert.isFalse(this.debounced.getDelayed())
      assert.isFalse(this.debounced.getPending())
      assert.equal(this.promisedValue, 'promisedValue')

  it "set promised callback delayed - promise has rejected", () ->
    promise = this.debounced.exec(this.promisedHandler, false, 'promisedValue')
    this.debounced.flush();
    this.firstPromiseReject('error');

    promise.catch (err) =>
      assert.isFalse(this.debounced.getDelayed())
      assert.isFalse(this.debounced.getPending())
      assert.isUndefined(this.promisedValue)
      assert.equal(err, 'error')


# TODO: set callback while current is delayed - check statuses
# TODO: set callback while current is pending - check statuses
# TODO: fulfill - check statuses
# TODO: error - check statuses
# TODO: cancel - check statuses



#  it "start saving and saving again in duration of last save. The second one must wait for first.", (done) ->
#    this.debounced.exec(this.saveHandler1, true, 'value1')
#    this.debounced.exec(this.saveHandler2, true, 'value2')
#
#    # at the moment only first callback is running
#    assert.equal(this.value1, 'value1')
#    assert.isUndefined(this.value2)
#
#    # fulfill first promise
#    this.promiseResolve1();
#
#    expect(this.firstPromise).to.eventually.notify =>
#      # the second promise is starting immediately
#      assert.equal(this.value2, 'value2')
#      done()
#
#  it "if the first promise was rejected, the second one will be start immediately", (done) ->
#    this.debounced.exec(this.saveHandler1, true, 'value1')
#    this.debounced.exec(this.saveHandler2, true, 'value2')
#
#    # reject first promise
#    this.promiseReject1('error');
#    Promise.all([
#      expect(this.firstPromise).to.eventually.rejected.and.equal('error'),
#      expect(this.firstPromise).to.eventually.notify =>
#        # the second promise is starting immediately
#        assert.equal(this.value2, 'value2')
#        done()
#    ]);
#    return undefined
