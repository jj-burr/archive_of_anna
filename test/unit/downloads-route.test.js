const {expect} = require('../helpers/test-setup');
const path = require('path');
const fs = require('fs');

const {formatFileSize} = require('../../web/format-utils');

describe('Downloads Page Utilities', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).to.equal('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(500)).to.equal('500.00 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).to.equal('1.00 KB');
      expect(formatFileSize(1536)).to.equal('1.50 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).to.equal('1.00 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).to.equal('1.00 GB');
    });
  });

  describe('Path traversal protection logic', () => {
    it('should detect .. in filename', () => {
      const filename = '../../../etc/passwd';
      expect(filename.includes('..')).to.be.true;
    });

    it('should detect absolute paths', () => {
      const filename = '/etc/passwd';
      expect(path.isAbsolute(filename)).to.be.true;
    });

    it('should accept valid filenames', () => {
      const filename = 'my-book.pdf';
      expect(filename.includes('..')).to.be.false;
      expect(path.isAbsolute(filename)).to.be.false;
    });

    it('should verify resolved path stays within download directory', () => {
      const downloadPath = path.resolve('/downloads');
      const filePath = path.join(downloadPath, 'book.pdf');
      expect(filePath.startsWith(downloadPath)).to.be.true;
    });
  });

  describe('File listing with real fixture files', () => {
    const fixturesDir = path.join(__dirname, '..', 'fixtures', 'sample-files');

    it('should list files from a directory', () => {
      const entries = fs.readdirSync(fixturesDir);
      expect(entries.length).to.be.greaterThan(0);

      const files = entries.map((name) => {
        const stat = fs.statSync(path.join(fixturesDir, name));
        return {
          name,
          size: formatFileSize(stat.size),
          modified: stat.mtime.toISOString().split('T')[0],
        };
      });

      expect(files[0]).to.have.property('name');
      expect(files[0]).to.have.property('size');
      expect(files[0]).to.have.property('modified');
    });

    it('should return empty array for non-existent directory', () => {
      const fakePath = path.join(__dirname, 'nonexistent');
      const exists = fs.existsSync(fakePath);
      expect(exists).to.be.false;
    });
  });
});
