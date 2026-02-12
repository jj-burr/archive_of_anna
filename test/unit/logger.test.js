const {expect} = require('../helpers/test-setup');
const winston = require('winston');

describe('Logger', () => {
  let logger;

  before(() => {
    logger = require('../../web/logger');
  });

  it('should be a winston logger instance', () => {
    expect(logger).to.exist;
    expect(logger.info).to.be.a('function');
    expect(logger.error).to.be.a('function');
    expect(logger.warn).to.be.a('function');
    expect(logger.debug).to.be.a('function');
  });

  it('should have 5 transports (4 file + 1 console)', () => {
    expect(logger.transports).to.have.length(5);
  });

  it('should have an error file transport at level error', () => {
    const errorTransport = logger.transports.find(
      (t) => t instanceof winston.transports.File &&
        t.level === 'error',
    );
    expect(errorTransport).to.exist;
    expect(errorTransport.filename).to.include('error.log');
  });

  it('should have an access file transport at level info', () => {
    const accessTransport = logger.transports.find(
      (t) => t instanceof winston.transports.File &&
        t.filename && t.filename.includes('access.log'),
    );
    expect(accessTransport).to.exist;
    expect(accessTransport.level).to.equal('info');
  });

  it('should have an application file transport at level info', () => {
    const appTransport = logger.transports.find(
      (t) => t instanceof winston.transports.File &&
        t.filename && t.filename.includes('application.log'),
    );
    expect(appTransport).to.exist;
    expect(appTransport.level).to.equal('info');
  });

  it('should have a system file transport at level debug', () => {
    const sysTransport = logger.transports.find(
      (t) => t instanceof winston.transports.File &&
        t.filename && t.filename.includes('system.log'),
    );
    expect(sysTransport).to.exist;
    expect(sysTransport.level).to.equal('debug');
  });

  it('should have a console transport', () => {
    const consoleTransport = logger.transports.find(
      (t) => t instanceof winston.transports.Console,
    );
    expect(consoleTransport).to.exist;
  });

  it('should have an access convenience method', () => {
    expect(logger.access).to.be.a('function');
  });

  it('should call info with type access when access() is used', () => {
    const {getSandbox} = require('../helpers/test-setup');
    const sandbox = getSandbox();
    const infoSpy = sandbox.spy(logger, 'info');

    logger.access('test request', {method: 'GET', url: '/test'});

    expect(infoSpy.calledOnce).to.be.true;
    const callArgs = infoSpy.firstCall.args;
    expect(callArgs[0]).to.equal('test request');
    expect(callArgs[1]).to.have.property('type', 'access');
    expect(callArgs[1]).to.have.property('method', 'GET');
  });
});
