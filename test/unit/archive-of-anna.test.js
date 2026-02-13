const {expect, getSandbox} = require('../helpers/test-setup');

describe('ArchiveOfAnna', () => {
  let ArchiveOfAnna;
  let searchHelper;
  let axiosHelper;
  let downloadHelper;
  let fastDownloadService;

  before(() => {
    searchHelper = require('../../src/helpers/search-helper');
    axiosHelper = require('../../src/helpers/axios-helper');
    downloadHelper = require('../../src/helpers/download-helper');
    fastDownloadService = require('../../src/services/fast-download-service');
    ArchiveOfAnna = require('../../src/archive-of-anna');
  });

  describe('constructor', () => {
    it('should throw on instantiation', () => {
      expect(() => new ArchiveOfAnna()).to.throw(
        'Initialising of this class is not allowed.',
      );
    });
  });

  describe('search', () => {
    it('should call buildSearchUrl, axiosHelper.get, and collectContents', async () => {
      const sandbox = getSandbox();
      const fakeUrl = new URL('https://annas-archive.li/search?q=test');
      const fakeHtml = '<html>search results</html>';
      const fakeResults = [{title: 'Book 1', md5: 'abc'}];

      sandbox.stub(searchHelper, 'buildSearchUrl').returns(fakeUrl);
      sandbox.stub(axiosHelper, 'get').resolves({data: fakeHtml});
      sandbox.stub(searchHelper, 'collectContents').returns(fakeResults);

      const result = await ArchiveOfAnna.search('test', 'en', 'book', 'pdf', 'newest');

      expect(searchHelper.buildSearchUrl.calledOnce).to.be.true;
      expect(searchHelper.buildSearchUrl.firstCall.args).to.deep.equal([
        'test', 'en', 'book', 'pdf', 'newest',
      ]);
      expect(axiosHelper.get.calledOnceWith(fakeUrl)).to.be.true;
      expect(searchHelper.collectContents.calledOnceWith(fakeHtml)).to.be.true;
      expect(result).to.deep.equal(fakeResults);
    });

    it('should propagate errors from axiosHelper.get', async () => {
      const sandbox = getSandbox();
      sandbox.stub(searchHelper, 'buildSearchUrl').returns(
        new URL('https://annas-archive.li/search?q=test'),
      );
      sandbox.stub(axiosHelper, 'get').rejects(new Error('Network error'));

      try {
        await ArchiveOfAnna.search('test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Network error');
      }
    });

    it('should use default parameters for optional arguments', async () => {
      const sandbox = getSandbox();
      sandbox.stub(searchHelper, 'buildSearchUrl').returns(
        new URL('https://annas-archive.li/search?q=test'),
      );
      sandbox.stub(axiosHelper, 'get').resolves({data: '<html></html>'});
      sandbox.stub(searchHelper, 'collectContents').returns([]);

      await ArchiveOfAnna.search('test');

      expect(searchHelper.buildSearchUrl.firstCall.args).to.deep.equal([
        'test', '', '', '', '',
      ]);
    });
  });

  describe('fetchByMd5', () => {
    it('should call buildFetchUrl, axiosHelper.get, and getContent', async () => {
      const sandbox = getSandbox();
      const fakeUrl = new URL('https://annas-archive.li/md5/abc123');
      const fakeHtml = '<html>content</html>';
      const fakeContent = {title: 'Test Book', md5: 'abc123'};

      sandbox.stub(searchHelper, 'buildFetchUrl').returns(fakeUrl);
      sandbox.stub(axiosHelper, 'get').resolves({data: fakeHtml});
      sandbox.stub(searchHelper, 'getContent').returns(fakeContent);

      const result = await ArchiveOfAnna.fetchByMd5('abc123');

      expect(searchHelper.buildFetchUrl.calledOnceWith('abc123')).to.be.true;
      expect(axiosHelper.get.calledOnceWith(fakeUrl)).to.be.true;
      expect(searchHelper.getContent.calledOnceWith(fakeHtml)).to.be.true;
      expect(result).to.deep.equal(fakeContent);
    });

    it('should propagate errors from axiosHelper.get', async () => {
      const sandbox = getSandbox();
      sandbox.stub(searchHelper, 'buildFetchUrl').returns(
        new URL('https://annas-archive.li/md5/abc123'),
      );
      sandbox.stub(axiosHelper, 'get').rejects(new Error('Not found'));

      try {
        await ArchiveOfAnna.fetchByMd5('abc123');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Not found');
      }
    });
  });

  describe('downloadFileViaIpfs', () => {
    it('should delegate to downloadHelper.ipfs', () => {
      const sandbox = getSandbox();
      const fakePromise = Promise.resolve('/tmp/file.pdf');
      sandbox.stub(downloadHelper, 'ipfs').returns(fakePromise);

      const links = ['ipfs://Qm1', 'ipfs://Qm2'];
      const result = ArchiveOfAnna.downloadFileViaIpfs(links, 'myfile', '/custom/path');

      expect(downloadHelper.ipfs.calledOnce).to.be.true;
      expect(downloadHelper.ipfs.firstCall.args).to.deep.equal([
        links, 'myfile', '/custom/path',
      ]);
      expect(result).to.equal(fakePromise);
    });

    it('should use default path when not specified', () => {
      const sandbox = getSandbox();
      sandbox.stub(downloadHelper, 'ipfs').returns(Promise.resolve());

      ArchiveOfAnna.downloadFileViaIpfs(['ipfs://Qm1']);

      expect(downloadHelper.ipfs.firstCall.args[1]).to.be.undefined;
      expect(downloadHelper.ipfs.firstCall.args[2]).to.equal('./tmp/');
    });
  });

  describe('downloadFileViaLibgen', () => {
    it('should delegate to downloadHelper.libgenDownload', () => {
      const sandbox = getSandbox();
      const fakePromise = Promise.resolve('/tmp/file.epub');
      sandbox.stub(downloadHelper, 'libgenDownload').returns(fakePromise);

      const links = ['http://libgen.rs/file.epub'];
      const result = ArchiveOfAnna.downloadFileViaLibgen(
        links, 'rs', 'myfile', '/custom/path',
      );

      expect(downloadHelper.libgenDownload.calledOnce).to.be.true;
      expect(downloadHelper.libgenDownload.firstCall.args).to.deep.equal([
        links, 'rs', 'myfile', '/custom/path',
      ]);
      expect(result).to.equal(fakePromise);
    });
  });

  describe('downloadByMd5', () => {
    it('should delegate to downloadHelper.downloadByMd5', async () => {
      const sandbox = getSandbox();
      sandbox.stub(downloadHelper, 'downloadByMd5').resolves('/tmp/file.pdf');

      const result = await ArchiveOfAnna.downloadByMd5(
        'abc123', 'myfile', '/custom/path', 'libgenRsFork',
      );

      expect(downloadHelper.downloadByMd5.calledOnce).to.be.true;
      expect(downloadHelper.downloadByMd5.firstCall.args).to.deep.equal([
        'abc123', 'myfile', '/custom/path', 'libgenRsFork',
      ]);
      expect(result).to.equal('/tmp/file.pdf');
    });

    it('should use default parameters', async () => {
      const sandbox = getSandbox();
      sandbox.stub(downloadHelper, 'downloadByMd5').resolves('/tmp/file.pdf');

      await ArchiveOfAnna.downloadByMd5('abc123');

      expect(downloadHelper.downloadByMd5.firstCall.args).to.deep.equal([
        'abc123', undefined, './tmp/', 'ipfs',
      ]);
    });
  });

  describe('getIpfsLinksByMd5', () => {
    it('should delegate to downloadHelper.getIpfsLinksByMd5', async () => {
      const sandbox = getSandbox();
      const fakeLinks = ['ipfs://Qm1', 'ipfs://Qm2'];
      sandbox.stub(downloadHelper, 'getIpfsLinksByMd5').resolves(fakeLinks);

      const result = await ArchiveOfAnna.getIpfsLinksByMd5('abc123');

      expect(downloadHelper.getIpfsLinksByMd5.calledOnceWith('abc123')).to.be.true;
      expect(result).to.deep.equal(fakeLinks);
    });
  });

  describe('getDownloadUrlsByMd5', () => {
    it('should delegate to downloadHelper.getDownloadUrlsByMd5', async () => {
      const sandbox = getSandbox();
      const fakeUrls = {ipfs: ['ipfs://Qm1'], libgenRsFork: []};
      sandbox.stub(downloadHelper, 'getDownloadUrlsByMd5').resolves(fakeUrls);

      const result = await ArchiveOfAnna.getDownloadUrlsByMd5('abc123');

      expect(downloadHelper.getDownloadUrlsByMd5.calledOnceWith('abc123')).to.be.true;
      expect(result).to.deep.equal(fakeUrls);
    });
  });

  describe('getAllDownloadSources', () => {
    it('should delegate to fastDownloadService.getAllDownloadSources', async () => {
      const sandbox = getSandbox();
      const fakeSources = {
        ipfs: {count: 2, urls: ['ipfs://Qm1', 'ipfs://Qm2']},
        libgenRsFork: {count: 1, urls: ['http://rs.example.com']},
        libgenLiFork: {count: 0, urls: []},
        total: 3,
      };
      sandbox.stub(fastDownloadService, 'getAllDownloadSources').resolves(fakeSources);

      const result = await ArchiveOfAnna.getAllDownloadSources('abc123');

      expect(fastDownloadService.getAllDownloadSources.calledOnceWith('abc123')).to.be.true;
      expect(result).to.deep.equal(fakeSources);
    });

    it('should propagate errors', async () => {
      const sandbox = getSandbox();
      sandbox.stub(fastDownloadService, 'getAllDownloadSources')
        .rejects(new Error('Service unavailable'));

      try {
        await ArchiveOfAnna.getAllDownloadSources('abc123');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Service unavailable');
      }
    });
  });
});
