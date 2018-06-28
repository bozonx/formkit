DebouncedCall = require('../../src/helpers/DebouncedCall').default


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

      #@debounced.flush()

      @debounced.exec(@promisedCb, true)

      assert.isFalse(@debounced.isWaiting())
      assert.isTrue(@debounced.isPending())

      #@debounced.flush()

      promise
        .then =>
          assert.isNull(@debounced._currentProcess)
          assert.isNull(@debounced._nextCb)
          sinon.assert.calledOnce(currentCb)
          sinon.assert.calledOnce(@promisedCb)

    it "replace cb in queue", ->
      currentCb = sinon.stub().returns(Promise.resolve())
      queuedCb = sinon.stub().returns(Promise.resolve())

      promise = @debounced.exec(currentCb, true)
      @debounced.exec(queuedCb, true)
      @debounced.exec(@promisedCb, true)

      promise
        .then =>
          sinon.assert.calledOnce(currentCb)
          sinon.assert.notCalled(queuedCb)
          sinon.assert.calledOnce(@promisedCb)

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
          assert.isTrue(@debounced.isWaiting())
          assert.isFalse(@debounced.isPending())

          @debounced.flush()

          assert.isFalse(@debounced.isWaiting())
          assert.isTrue(@debounced.isPending())

          promise
            .then =>
              assert.isNull(@debounced._currentProcess)
              assert.isNull(@debounced._nextCb)
              assert.isFalse(@debounced.isWaiting())
              assert.isFalse(@debounced.isPending())
              sinon.assert.calledOnce(currentCb)
              sinon.assert.calledOnce(@promisedCb)

    it "replace cb in queue", ->
      firstPromise = Promise.resolve()
      currentCb = sinon.stub().returns(firstPromise)
      queuedCb = sinon.stub().returns(Promise.resolve())

      promise = @debounced.exec(currentCb, false)
      @debounced.flush()
      @debounced.exec(queuedCb, false)
      @debounced.exec(@promisedCb, false)

      firstPromise
        .then =>
          @debounced.flush()

          promise
            .then =>
              sinon.assert.calledOnce(currentCb)
              sinon.assert.notCalled(queuedCb)
              sinon.assert.calledOnce(@promisedCb)

  describe 'cancel.', ->
    it "cancel delayed", () ->
      @debounced.exec(@promisedCb, false)

      assert.isTrue(@debounced.isWaiting())

      @debounced.cancel()

      assert.isFalse(@debounced.isWaiting())
      assert.isNull(@debounced._currentProcess)
      sinon.assert.notCalled(@promisedCb)

    it "cancel promise in progress - it don't cancel it but clears the queue", () ->
      currentCb = sinon.stub().returns(Promise.resolve())
      queuedCb = sinon.stub().returns(Promise.resolve())

      promise = @debounced.exec(currentCb, true)
      @debounced.exec(queuedCb, false)

      assert.isArray(@debounced._nextCb)

      @debounced.cancel()

      assert.isNull(@debounced._nextCb)
      assert.isNull(@debounced._currentProcess)

      promise
        .then =>
           sinon.assert.calledOnce(currentCb)
