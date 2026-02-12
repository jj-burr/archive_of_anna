const {expect, getSandbox} = require('../../helpers/test-setup');
const fs = require('fs');
const stream = require('stream');

describe('File Helper', () => {
  let fileHelper;

  before(() => {
    fileHelper = require('../../../src/helpers/file-helper');
  });

  describe('directorySetup', () => {
    it('should create directory when it does not exist', () => {
      const sandbox = getSandbox();
      sandbox.stub(fs, 'existsSync').returns(false);
      const mkdirStub = sandbox.stub(fs, 'mkdirSync');

      fileHelper.directorySetup('/some/path');

      expect(mkdirStub.calledOnce).to.be.true;
      expect(mkdirStub.calledWith('/some/path', {recursive: true})).to.be.true;
    });

    it('should skip creation when directory exists', () => {
      const sandbox = getSandbox();
      sandbox.stub(fs, 'existsSync').returns(true);
      const mkdirStub = sandbox.stub(fs, 'mkdirSync');

      fileHelper.directorySetup('/existing/path');

      expect(mkdirStub.called).to.be.false;
    });
  });

  describe('writeFileToPath', () => {
    it('should create write stream at the joined path', async () => {
      const sandbox = getSandbox();
      const mockWriter = new stream.PassThrough();
      const mockContent = new stream.PassThrough();

      sandbox.stub(fs, 'createWriteStream').returns(mockWriter);
      sandbox.stub(fs, 'existsSync').returns(true);

      // End the content stream immediately so pipeline resolves
      process.nextTick(() => {
        mockContent.end('test data');
      });

      const result = await fileHelper.writeFileToPath(
        '/downloads', 'test.pdf', mockContent,
      );

      expect(fs.createWriteStream.calledOnce).to.be.true;
      const calledPath = fs.createWriteStream.firstCall.args[0];
      expect(calledPath).to.include('test.pdf');
      expect(result).to.be.true;
    });

    it('should return true when file exists after write', async () => {
      const sandbox = getSandbox();
      const mockWriter = new stream.PassThrough();
      const mockContent = new stream.PassThrough();

      sandbox.stub(fs, 'createWriteStream').returns(mockWriter);
      sandbox.stub(fs, 'existsSync').returns(true);

      process.nextTick(() => {
        mockContent.end('test data');
      });

      const result = await fileHelper.writeFileToPath(
        '/downloads', 'book.epub', mockContent,
      );

      expect(result).to.be.true;
    });
  });
});
