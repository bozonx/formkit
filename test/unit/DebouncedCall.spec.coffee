DebouncedCall = require('../../src/DebouncedCall').default

describe 'Unit. DebouncedCall.', ->
  beforeEach () ->
    this.debounced = new DebouncedCall(300);

  describe 'Simple callback.', ->
    beforeEach () ->
      this.simpleValue = undefined;
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

  describe 'Promises.', ->
    beforeEach () ->
      this.promisedHandler = undefined;
      this.firstPromiseResolve = undefined;
      this.firstPromiseReject = undefined;
      this.promisedValue = undefined;

      this.promisedHandler = (value) =>
        return new Promise (resolve, reject) =>
          this.firstPromiseResolve = () =>
            this.promisedValue = value;
            resolve()
          this.firstPromiseReject = reject

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


  describe 'Collisions with delay.', ->
    beforeEach () ->
      this.firstHandler = sinon.spy()
      this.secondHandler = sinon.spy()

    it "set simple callback not force while current is delayed - the first will be canceled", () ->
      this.debounced.exec(this.firstHandler, false)
      this.debounced.exec(this.secondHandler, false)
      this.debounced.flush();

      expect(this.firstHandler).to.have.not.been.called
      expect(this.secondHandler).to.have.been.calledOnce

    it "set simple callback force while current is delayed - the first will be canceled", () ->
      this.debounced.exec(this.firstHandler, false)
      this.debounced.exec(this.secondHandler, true)
      # TODO: поидее flush тут не нужен
      this.debounced.flush();

      expect(this.firstHandler).to.have.not.been.called
      expect(this.secondHandler).to.have.been.calledOnce

    it "set both simple callbacks force - all of them have to run", () ->
      this.debounced.exec(this.firstHandler, true)
      this.debounced.exec(this.secondHandler, true)

      expect(this.firstHandler).to.have.been.calledOnce
      expect(this.secondHandler).to.have.been.calledOnce

  describe 'Collisions with promise pending.', ->
    beforeEach () ->
      this.promisedHandler = () =>
        return new Promise (resolve, reject) =>
          this.firstPromiseResolve = resolve
          this.firstPromiseReject = reject
      this.secondHandler = sinon.spy()

    it "set promised callback while current is pending - they run in order", () ->
      promise1 = this.debounced.exec(this.promisedHandler, false)
      this.debounced.flush();

      assert.isFalse(this.debounced.getDelayed())
      assert.isTrue(this.debounced.getPending())

      this.debounced.exec(this.secondHandler, false)
      # the second one is in queue
      assert.deepEqual(this.debounced._queuedCallback.cb, this.secondHandler)

      this.firstPromiseResolve()

      expect(this.secondHandler).to.have.not.been.called

      promise1.then =>
        expect(this.secondHandler).to.have.been.calledOnce

  describe 'Collisions with promise pending.', ->


# TODO: cancel - check statuses
