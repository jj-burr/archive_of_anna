const {expect, getSandbox} = require('../../helpers/test-setup');

describe('Fast Download Service', () => {
  let fastDownloadService;
  let axiosHelper;
  let config;

  before(() => {
    axiosHelper = require('../../../src/helpers/axios-helper');
    config = require('../../../src/config');
    fastDownloadService = require('../../../src/services/fast-download-service');
  });

  describe('getDownloadUrls', () => {
    describe('API path (with secretKey)', () => {
      it('should call the fast download API when secretKey is set', async () => {
        const sandbox = getSandbox();
        const originalKey = config.secretKey;
        config.secretKey = 'test-secret-key';

        const apiResponse = {
          ipfs: ['ipfs://Qm123'],
          libgenRsFork: ['http://libgen.rs/file.pdf'],
          libgenLiFork: [],
          zLibTor: [],
        };

        sandbox.stub(axiosHelper, 'get').resolves({
          status: 200,
          data: apiResponse,
        });

        const result = await fastDownloadService.getDownloadUrls('abc123');

        expect(result).to.deep.equal(apiResponse);
        expect(axiosHelper.get.calledOnce).to.be.true;
        expect(axiosHelper.get.firstCall.args[0]).to.include('abc123');
        expect(axiosHelper.get.firstCall.args[0]).to.include('test-secret-key');

        config.secretKey = originalKey;
      });

      it('should fall back to scraping when API returns non-200', async () => {
        const sandbox = getSandbox();
        const originalKey = config.secretKey;
        config.secretKey = 'test-secret-key';

        const getStub = sandbox.stub(axiosHelper, 'get');

        // First call (API) returns non-200
        getStub.onFirstCall().resolves({status: 403, data: null});

        // Second call (scrape fallback) returns HTML
        const htmlResponse = `<main>
          <div class="js-technical-details hidden">
            <div><div>${JSON.stringify({
              md5: 'abc123',
              file_unified_data: {
                title_best: 'Test', author_best: 'Auth',
                author_additional: [], year_best: '2023',
                publisher_best: 'Pub', extension_best: 'pdf',
                cover_url_best: '', stripped_description_best: '',
                sanitized_isbns: [],
              },
              additional: {
                download_urls: [['IPFS', 'ipfs://Qm123']],
              },
            })}</div></div>
          </div>
        </main>`;
        getStub.onSecondCall().resolves({status: 200, data: htmlResponse});

        const result = await fastDownloadService.getDownloadUrls('abc123');

        expect(getStub.calledTwice).to.be.true;
        expect(result.ipfs).to.deep.equal(['ipfs://Qm123']);

        config.secretKey = originalKey;
      });
    });

    describe('scrape fallback (without secretKey)', () => {
      it('should scrape the content page when no secretKey', async () => {
        const sandbox = getSandbox();
        const originalKey = config.secretKey;
        config.secretKey = null;

        const htmlResponse = `<main>
          <div class="js-technical-details hidden">
            <div><div>${JSON.stringify({
              md5: 'def456',
              file_unified_data: {
                title_best: 'Scraped Book', author_best: 'Author',
                author_additional: [], year_best: '2022',
                publisher_best: 'Publisher', extension_best: 'epub',
                cover_url_best: '', stripped_description_best: '',
                sanitized_isbns: [],
              },
              additional: {
                download_urls: [
                  ['Libgen.rs-fork', 'http://libgen.rs/test.epub'],
                  ['IPFS', 'ipfs://QmABC'],
                ],
              },
            })}</div></div>
          </div>
        </main>`;

        sandbox.stub(axiosHelper, 'get').resolves({
          status: 200,
          data: htmlResponse,
        });

        const result = await fastDownloadService.getDownloadUrls('def456');

        expect(axiosHelper.get.calledOnce).to.be.true;
        expect(axiosHelper.get.firstCall.args[0]).to.include('/md5/def456');
        expect(result.ipfs).to.deep.equal(['ipfs://QmABC']);
        expect(result.libgenRsFork).to.deep.equal(['http://libgen.rs/test.epub']);

        config.secretKey = originalKey;
      });
    });

    describe('error handling', () => {
      it('should wrap errors with MD5 in message', async () => {
        const sandbox = getSandbox();
        const originalKey = config.secretKey;
        config.secretKey = null;

        sandbox.stub(axiosHelper, 'get').rejects(new Error('Network failure'));

        try {
          await fastDownloadService.getDownloadUrls('abc123');
          expect.fail('Should have thrown');
        } catch (err) {
          expect(err.message).to.include('abc123');
          expect(err.message).to.include('Fast download failed');
        }

        config.secretKey = originalKey;
      });

      it('should throw when scrape returns non-200', async () => {
        const sandbox = getSandbox();
        const originalKey = config.secretKey;
        config.secretKey = null;

        sandbox.stub(axiosHelper, 'get').resolves({status: 500, data: null});

        try {
          await fastDownloadService.getDownloadUrls('abc123');
          expect.fail('Should have thrown');
        } catch (err) {
          expect(err.message).to.include('abc123');
        }

        config.secretKey = originalKey;
      });
    });
  });

  describe('getIpfsLinks', () => {
    it('should return ipfs array from download urls', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getDownloadUrls').resolves({
        ipfs: ['ipfs://Qm111', 'ipfs://Qm222'],
        libgenRsFork: ['http://libgen.rs/file.pdf'],
      });

      const result = await fastDownloadService.getIpfsLinks('abc123');

      expect(result).to.deep.equal(['ipfs://Qm111', 'ipfs://Qm222']);
    });

    it('should return empty array when no ipfs links exist', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getDownloadUrls').resolves({
        libgenRsFork: ['http://libgen.rs/file.pdf'],
      });

      const result = await fastDownloadService.getIpfsLinks('abc123');

      expect(result).to.deep.equal([]);
    });

    it('should propagate errors with MD5 in message', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getDownloadUrls')
        .rejects(new Error('API down'));

      try {
        await fastDownloadService.getIpfsLinks('abc123');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('abc123');
        expect(err.message).to.include('Failed to get IPFS links');
      }
    });
  });

  describe('getAllDownloadSources', () => {
    it('should structure all source types with counts', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getDownloadUrls').resolves({
        ipfs: ['ipfs://Qm1', 'ipfs://Qm2'],
        libgenRsFork: ['http://rs.example.com/file.pdf'],
        libgenLiFork: ['http://li.example.com/file.pdf'],
        zLibTor: ['http://zlib.onion/file.pdf'],
      });

      const result = await fastDownloadService.getAllDownloadSources('abc123');

      expect(result.ipfs.count).to.equal(2);
      expect(result.ipfs.urls).to.have.length(2);
      expect(result.libgenRsFork.count).to.equal(1);
      expect(result.libgenLiFork.count).to.equal(1);
      expect(result.total).to.equal(5);
    });

    it('should handle missing source arrays with optional chaining', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getDownloadUrls').resolves({});

      const result = await fastDownloadService.getAllDownloadSources('abc123');

      expect(result.ipfs.count).to.equal(0);
      expect(result.ipfs.urls).to.deep.equal([]);
      expect(result.libgenRsFork.count).to.equal(0);
      expect(result.libgenLiFork.count).to.equal(0);
      expect(result.total).to.equal(0);
    });

    it('should propagate errors with MD5 in message', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getDownloadUrls')
        .rejects(new Error('Something went wrong'));

      try {
        await fastDownloadService.getAllDownloadSources('abc123');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('abc123');
        expect(err.message).to.include('Failed to get download sources');
      }
    });
  });
});
