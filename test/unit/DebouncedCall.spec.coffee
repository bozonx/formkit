DebouncedCall = require('../../src/helpers/DebouncedCall')


describe 'Unit. DebouncedCall.', ->
  beforeEach () ->
    @debounced = new DebouncedCall(300);
    @promisedCb = sinon.stub().returns(Promise.resolve())

  describe.only 'force', ->
    it "there isn't pending or waiting cb before run", ->
      promise = @debounced.exec(@promisedCb, true, 'cbParam')

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      promise
        .then =>
          assert.isNull(@debounced._currentProcess)
          assert.isNull(@debounced._nextCbWaitPromise)
          sinon.assert.calledOnce(@promisedCb)
          sinon.assert.calledWith(@promisedCb, 'cbParam')

    it "there is waiting cb before run - it replaces current cb", ->
      currentCb = sinon.stub().returns(Promise.resolve())
      @debounced.exec(currentCb, false)
      promise = @debounced.exec(@promisedCb, true)

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      promise
        .then =>
          assert.isNull(@debounced._currentProcess)
          assert.isNull(@debounced._nextCbWaitPromise)
          sinon.assert.notCalled(currentCb)
          sinon.assert.calledOnce(@promisedCb)

    it "there is pending cb before run - it moves to queue and will start as soon as current cb has finished", ->
      currentCb = sinon.stub().returns(Promise.resolve())
      @debounced.exec(currentCb, true)

      @debounced.flush()

      promise = @debounced.exec(@promisedCb, true)

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      @debounced.flush()

      promise
        .then =>
          #assert.isNull(@debounced._currentProcess)
          #assert.isNull(@debounced._nextCbWaitPromise)
          sinon.assert.calledOnce(currentCb)
          sinon.assert.calledOnce(@promisedCb)

  describe.only 'with debounce', ->
    it "there isn't pending or waiting cb before run", ->
      promise = @debounced.exec(@promisedCb, false, 'cbParam')

      assert.isTrue(@debounced.isWaiting())
      assert.isFalse(@debounced.isPending())

      @debounced.flush()

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      promise
        .then =>
          assert.isNull(@debounced._currentProcess)
          assert.isNull(@debounced._nextCbWaitPromise)
          sinon.assert.calledOnce(@promisedCb)
          sinon.assert.calledWith(@promisedCb, 'cbParam')

    it "there is waiting cb before run - it replaces current cb", ->
      currentCb = sinon.stub().returns(Promise.resolve())
      @debounced.exec(currentCb, false)
      promise = @debounced.exec(@promisedCb, false)

      assert.isTrue(@debounced.isWaiting())
      assert.isFalse(@debounced.isPending())

      @debounced.flush()

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      promise
        .then =>
          assert.isNull(@debounced._currentProcess)
          assert.isNull(@debounced._nextCbWaitPromise)

          sinon.assert.notCalled(currentCb)
          sinon.assert.calledOnce(@promisedCb)






  describe 'Simple callback.', ->
    beforeEach () ->
      @simpleValue = undefined;
      @simpleHandler = (value) =>
        @simpleValue = value;

    it "set simple callback force - check statuses and result", ->
      assert.isFalse(@debounced.isWaiting())
      assert.isFalse(@debounced.isPending())

      @debounced.exec(@simpleHandler, true, 'simpleValue')

      assert.isFalse(@debounced.isWaiting())
      assert.isFalse(@debounced.isPending())
      assert.equal(@simpleValue, 'simpleValue')

    it "set simple callback force - check promise", ->
      promise = @debounced.exec(@simpleHandler, true, 'simpleValue')

      promise.then () =>
        assert.isFalse(@debounced.isWaiting())
        assert.isFalse(@debounced.isPending())
        assert.equal(@simpleValue, 'simpleValue')

    it "set simple callback delayed", ->
      promise = @debounced.exec(@simpleHandler, false, 'simpleValue')
      @debounced.flush();

      promise.then () =>
        assert.isFalse(@debounced.isWaiting())
        assert.isFalse(@debounced.isPending())
        assert.equal(@simpleValue, 'simpleValue')

  describe 'Promises.', ->
    beforeEach () ->
      @promisedHandler = undefined;
      @firstPromiseResolve = undefined;
      @firstPromiseReject = undefined;
      @promisedValue = undefined;

      @promisedHandler = (value) =>
        return new Promise (resolve, reject) =>
          @firstPromiseResolve = () =>
            @promisedValue = value;
            resolve()
          @firstPromiseReject = reject

    it "set promised callback force", ->
      promise = @debounced.exec(@promisedHandler, true, 'promisedValue')
      @firstPromiseResolve();

      promise.then () =>
        assert.isFalse(@debounced.isWaiting())
        assert.isFalse(@debounced.isPending())
        assert.equal(@promisedValue, 'promisedValue')

    it "set promised callback delayed", () ->
      promise = @debounced.exec(@promisedHandler, false, 'promisedValue')
      @debounced.flush();
      @firstPromiseResolve();

      promise.then () =>
        assert.isFalse(@debounced.isWaiting())
        assert.isFalse(@debounced.isPending())
        assert.equal(@promisedValue, 'promisedValue')

    it "set promised callback delayed - promise has rejected", () ->
      promise = @debounced.exec(@promisedHandler, false, 'promisedValue')
      @debounced.flush();
      @firstPromiseReject('error');

      promise.catch (err) =>
        assert.isFalse(@debounced.isWaiting())
        assert.isFalse(@debounced.isPending())
        assert.isUndefined(@promisedValue)
        assert.equal(err, 'error')


  describe 'Collisions with delay.', ->
    beforeEach () ->
      @firstHandler = sinon.spy()
      @secondHandler = sinon.spy()

    it "set simple callback not force while current is delayed - the first will be canceled", () ->
      @debounced.exec(@firstHandler, false)
      @debounced.exec(@secondHandler, false)
      @debounced.flush();

      expect(@firstHandler).to.have.not.been.called
      expect(@secondHandler).to.have.been.calledOnce

    it "set simple callback force while current is delayed - the first will be canceled", () ->
      @debounced.exec(@firstHandler, false)
      @debounced.exec(@secondHandler, true)

      expect(@firstHandler).to.have.not.been.called
      expect(@secondHandler).to.have.been.calledOnce

    it "set both simple callbacks force - all of them have to run", () ->
      @debounced.exec(@firstHandler, true)
      @debounced.exec(@secondHandler, true)

      expect(@firstHandler).to.have.been.calledOnce
      expect(@secondHandler).to.have.been.calledOnce

  describe 'Collisions with promise pending.', ->
    beforeEach () ->
      @promisedHandler = () =>
        return new Promise (resolve, reject) =>
          @firstPromiseResolve = resolve
          @firstPromiseReject = reject
      @secondHandler = sinon.spy()

    it "set promised callback while current is pending - they run in order", () ->
      promise1 = @debounced.exec(@promisedHandler, false)
      @debounced.flush();

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      @debounced.exec(@secondHandler, false)
      # the second one is in queue
      assert.deepEqual(@debounced._queuedProcess.cb, @secondHandler)

      @firstPromiseResolve()

      expect(@secondHandler).to.have.not.been.called

      promise1.then =>
        expect(@secondHandler).to.have.been.calledOnce

  describe 'cancel.', ->
    beforeEach () ->
      @promisedHandler = () =>
        return new Promise (resolve, reject) =>
          @firstPromiseResolve = resolve
          @firstPromiseReject = reject

    it "cancel delayed", () ->
      firstHandler = sinon.spy()
      @debounced.exec(firstHandler, false)
      assert.isTrue(@debounced.isWaiting())
      @debounced.cancel()
      assert.isFalse(@debounced.isWaiting())

      expect(firstHandler).to.have.not.been.called

    it "cancel promise in progress", () ->
      secondHandler = sinon.spy()
      @debounced.exec(@promisedHandler, false)
      @debounced.flush();
      @debounced.exec(secondHandler, false)

      assert.isTrue(@debounced.isPending())

      @debounced.cancel()

      assert.isFalse(@debounced.isPending())

      assert.isNull(@debounced._queuedProcess)
      expect(secondHandler).to.have.not.been.called
