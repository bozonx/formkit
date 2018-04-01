DebouncedCall = require('../../src/helpers/DebouncedCall')


describe 'Unit. DebouncedCall.', ->
  beforeEach () ->
    @debounced = new DebouncedCall(300);
    @promisedCb = sinon.stub().returns(Promise.resolve())

  describe 'force', ->
    it "there isn't pending or waiting cb before run", ->
      promise = @debounced.exec(@promisedCb, true, 'cbParam')

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      promise
        .then =>
          assert.isNull(@debounced._currentProcess)
          assert.isNull(@debounced._nextCb)
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
          assert.isNull(@debounced._nextCb)
          sinon.assert.notCalled(currentCb)
          sinon.assert.calledOnce(@promisedCb)

    it "there is pending cb before run - it moves to queue and will start as soon as current cb has finished", ->
      currentCb = sinon.stub().returns(Promise.resolve())
      promise = @debounced.exec(currentCb, true)

      @debounced.flush()

      @debounced.exec(@promisedCb, true)

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      @debounced.flush()

      promise
        .then =>
          assert.isNull(@debounced._currentProcess)
          assert.isNull(@debounced._nextCb)
          sinon.assert.calledOnce(currentCb)
          sinon.assert.calledOnce(@promisedCb)

    # TODO: replace queue

  describe 'with debounce', ->
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
          assert.isNull(@debounced._nextCb)
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
          assert.isNull(@debounced._nextCb)

          sinon.assert.notCalled(currentCb)
          sinon.assert.calledOnce(@promisedCb)

    it "there is pending cb before run - cb moves to queue and wait for call", ->
      firstPromise = Promise.resolve()
      currentCb = sinon.stub().returns(firstPromise)
      # add first cb
      promise = @debounced.exec(currentCb, false)

      # first cb is waiting
      @debounced.flush()
      # first cb is pending

      # add second cb. It has to be added to queue
      @debounced.exec(@promisedCb, false)
      # first cb is pending and new cb in queue

      assert.isArray(@debounced._nextCb)

      firstPromise
        .then =>
          assert.isNull(@debounced._nextCb)
          assert.isFalse(@debounced.isWaiting())
          assert.isTrue(@debounced.isPending())

          promise
            .then =>
              assert.isNull(@debounced._currentProcess)
              assert.isNull(@debounced._nextCb)
              sinon.assert.calledOnce(currentCb)
              sinon.assert.calledOnce(@promisedCb)

    # TODO: replace queue

  # TODO: test cancel
  # TODO: test stop


#  describe 'cancel.', ->
#    beforeEach () ->
#      @promisedHandler = () =>
#        return new Promise (resolve, reject) =>
#          @firstPromiseResolve = resolve
#          @firstPromiseReject = reject
#
#    it "cancel delayed", () ->
#      firstHandler = sinon.spy()
#      @debounced.exec(firstHandler, false)
#      assert.isTrue(@debounced.isWaiting())
#      @debounced.cancel()
#      assert.isFalse(@debounced.isWaiting())
#
#      expect(firstHandler).to.have.not.been.called
#
#    it "cancel promise in progress", () ->
#      secondHandler = sinon.spy()
#      @debounced.exec(@promisedHandler, false)
#      @debounced.flush();
#      @debounced.exec(secondHandler, false)
#
#      assert.isTrue(@debounced.isPending())
#
#      @debounced.cancel()
#
#      assert.isFalse(@debounced.isPending())
#
#      assert.isNull(@debounced._queuedProcess)
#      expect(secondHandler).to.have.not.been.called
