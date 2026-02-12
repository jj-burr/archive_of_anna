const {expect, getSandbox} = require('../../helpers/test-setup');
const axios = require('axios');

describe('Axios Helper', () => {
  let axiosHelper;

  before(() => {
    axiosHelper = require('../../../src/helpers/axios-helper');
  });

  describe('get', () => {
    it('should pass User-Agent header', async () => {
      const sandbox = getSandbox();
      const getStub = sandbox.stub(axios, 'get').resolves({
        status: 200,
        data: {},
      });

      await axiosHelper.get('http://example.com');

      expect(getStub.calledOnce).to.be.true;
      const config = getStub.firstCall.args[1];
      expect(config.headers).to.have.property(
        'User-Agent', 'PostmanRuntime/7.30.0',
      );
    });
  });

  describe('download', () => {
    it('should set responseType to stream', async () => {
      const sandbox = getSandbox();
      const getStub = sandbox.stub(axios, 'get').resolves({
        status: 200,
        data: 'stream-data',
      });

      await axiosHelper.download('http://example.com/file.pdf');

      expect(getStub.calledOnce).to.be.true;
      const config = getStub.firstCall.args[1];
      expect(config.responseType).to.equal('stream');
    });

    it('should track progress via setProgress callback', async () => {
      const sandbox = getSandbox();
      let capturedCallback;

      sandbox.stub(axios, 'get').callsFake((url, config) => {
        capturedCallback = config.onDownloadProgress;
        return Promise.resolve({status: 200, data: 'stream-data'});
      });

      const store = require('../../../src/store');
      await axiosHelper.download('http://example.com/file.pdf', 'myfile');

      // Invoke the progress callback
      expect(capturedCallback).to.be.a('function');
      capturedCallback({loaded: 50, total: 100});

      expect(store.downloadProgress['myfile']).to.equal(50);
    });
  });
});
