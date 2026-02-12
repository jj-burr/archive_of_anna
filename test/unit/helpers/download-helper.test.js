const {expect, getSandbox} = require('../../helpers/test-setup');
const fastDownloadService = require('../../../src/services/fast-download-service');
const logger = require('../../../web/logger');

describe('Download Helper', () => {
  let downloadHelper;

  before(() => {
    downloadHelper = require('../../../src/helpers/download-helper');
  });

  describe('downloadByMd5', () => {
    it('should throw when no download sources found (total === 0)', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getAllDownloadSources').resolves({
        total: 0,
      });

      try {
        await downloadHelper.downloadByMd5('abc123', null, '/tmp', 'ipfs');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('abc123');
        expect(err.message).to.include('No download sources found');
      }
    });

    it('should try preferred source first', async () => {
      const sandbox = getSandbox();
      const axiosHelper = require('../../../src/helpers/axios-helper');
      const fileHelper = require('../../../src/helpers/file-helper');

      sandbox.stub(fastDownloadService, 'getAllDownloadSources').resolves({
        total: 2,
        libgenRsFork: {count: 1, urls: ['http://libgen.rs/file.pdf']},
        ipfs: {count: 1, urls: ['http://ipfs.io/file.pdf']},
      });

      // Stub fileHelper.directorySetup
      sandbox.stub(fileHelper, 'directorySetup');

      // Stub axiosHelper.download to return a valid response
      sandbox.stub(axiosHelper, 'download').resolves({
        status: 200,
        data: 'file-content',
        headers: {'content-disposition': 'attachment; filename="book.pdf"'},
      });

      // Stub fileHelper.writeFileToPath
      sandbox.stub(fileHelper, 'writeFileToPath').resolves(true);

      await downloadHelper.downloadByMd5('abc123', null, '/tmp', 'libgenRsFork');

      // First call should be to the preferred source URL
      expect(axiosHelper.download.firstCall.args[0]).to.equal(
        'http://libgen.rs/file.pdf',
      );
    });

    it('should use logger.warn on fallback, not console.warn', async () => {
      const sandbox = getSandbox();
      const axiosHelper = require('../../../src/helpers/axios-helper');
      const fileHelper = require('../../../src/helpers/file-helper');

      sandbox.stub(fastDownloadService, 'getAllDownloadSources').resolves({
        total: 2,
        ipfs: {count: 1, urls: ['http://ipfs.io/file.pdf']},
        libgenRsFork: {count: 1, urls: ['http://libgen.rs/file.pdf']},
      });

      sandbox.stub(fileHelper, 'directorySetup');

      // First source fails, second succeeds
      let callCount = 0;
      sandbox.stub(axiosHelper, 'download').callsFake(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Connection timeout'));
        }
        return Promise.resolve({
          status: 200,
          data: 'file-content',
          headers: {'content-disposition': 'attachment; filename="book.pdf"'},
        });
      });
      sandbox.stub(fileHelper, 'writeFileToPath').resolves(true);

      const warnSpy = sandbox.spy(logger, 'warn');
      const consoleWarnSpy = sandbox.spy(console, 'warn');

      await downloadHelper.downloadByMd5('abc123', null, '/tmp', 'ipfs');

      expect(warnSpy.called).to.be.true;
      expect(consoleWarnSpy.called).to.be.false;
    });

    it('should throw when all sources fail', async () => {
      const sandbox = getSandbox();
      const axiosHelper = require('../../../src/helpers/axios-helper');
      const fileHelper = require('../../../src/helpers/file-helper');

      sandbox.stub(fastDownloadService, 'getAllDownloadSources').resolves({
        total: 1,
        ipfs: {count: 1, urls: ['http://ipfs.io/file.pdf']},
      });

      sandbox.stub(fileHelper, 'directorySetup');
      sandbox.stub(axiosHelper, 'download').rejects(
        new Error('Server unavailable'),
      );

      try {
        await downloadHelper.downloadByMd5('abc123', null, '/tmp', 'ipfs');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('abc123');
      }
    });
  });

  describe('torDownload', () => {
    it('should throw not-implemented error', async () => {
      try {
        await downloadHelper.torDownload([], null, '/tmp');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('Tor download not yet implemented');
      }
    });
  });
});
