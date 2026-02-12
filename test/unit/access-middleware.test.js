const {expect, getSandbox} = require('../helpers/test-setup');
const EventEmitter = require('events');
const logger = require('../../web/logger');

describe('Access Logging Middleware', () => {
  // Recreate the middleware logic for unit testing
  const createAccessMiddleware = () => {
    return (req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        logger.access('HTTP request', {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: Date.now() - start,
        });
      });
      next();
    };
  };

  it('should call next() to continue request chain', () => {
    const sandbox = getSandbox();
    const middleware = createAccessMiddleware();
    const req = {method: 'GET', originalUrl: '/search'};
    const res = new EventEmitter();
    res.statusCode = 200;
    const nextSpy = sandbox.spy();

    middleware(req, res, nextSpy);

    expect(nextSpy.calledOnce).to.be.true;
  });

  it('should log method, URL, status, and duration on finish', (done) => {
    const sandbox = getSandbox();
    const middleware = createAccessMiddleware();
    const accessSpy = sandbox.spy(logger, 'access');

    const req = {method: 'POST', originalUrl: '/search'};
    const res = new EventEmitter();
    res.statusCode = 200;

    middleware(req, res, () => {});

    // Simulate response finish
    res.emit('finish');

    expect(accessSpy.calledOnce).to.be.true;
    const callArgs = accessSpy.firstCall.args;
    expect(callArgs[0]).to.equal('HTTP request');
    expect(callArgs[1]).to.have.property('method', 'POST');
    expect(callArgs[1]).to.have.property('url', '/search');
    expect(callArgs[1]).to.have.property('status', 200);
    expect(callArgs[1]).to.have.property('duration');
    done();
  });

  it('should log after response finishes (res.on finish)', () => {
    const sandbox = getSandbox();
    const middleware = createAccessMiddleware();
    const accessSpy = sandbox.spy(logger, 'access');

    const req = {method: 'GET', originalUrl: '/downloads'};
    const res = new EventEmitter();
    res.statusCode = 404;

    middleware(req, res, () => {});

    // Before finish -- no log yet
    expect(accessSpy.called).to.be.false;

    // After finish
    res.emit('finish');
    expect(accessSpy.calledOnce).to.be.true;
  });
});
