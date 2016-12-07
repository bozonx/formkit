DebouncedCall = require('../../src/DebouncedCall').default

describe 'Unit. DebouncedCall.', ->
  beforeEach () ->
    this.debounced = new DebouncedCall(300);

    this.firstPromise = new Promise (resolve, reject) =>
      this.promiseResolve1 = resolve
      this.promiseReject1 = reject

    this.saveHandler1 = (value) =>
      this.value1 = value;
      return this.firstPromise

    this.saveHandler2 = (value) =>
      this.value2 = value;

  it "start saving and saving again in duration of last save. The second one must wait for first.", (done) ->
    this.debounced.exec(this.saveHandler1, true, 'value1')
    this.debounced.exec(this.saveHandler2, true, 'value2')

    # at the moment only first callback is running
    assert.equal(this.value1, 'value1')
    assert.isUndefined(this.value2)

    # fulfill first promise
    this.promiseResolve1();

    expect(this.firstPromise).to.eventually.notify =>
      # the second promise is starting immediately
      assert.equal(this.value2, 'value2')
      done()

  it "if the first promise was rejected, the second one will be start immediately", (done) ->
    this.debounced.exec(this.saveHandler1, true, 'value1')
    this.debounced.exec(this.saveHandler2, true, 'value2')

    # reject first promise
    this.promiseReject1('error');
    Promise.all([
      expect(this.firstPromise).to.eventually.rejected.and.equal('error'),
      expect(this.firstPromise).to.eventually.notify =>
        # the second promise is starting immediately
        assert.equal(this.value2, 'value2')
        done()
    ]);
