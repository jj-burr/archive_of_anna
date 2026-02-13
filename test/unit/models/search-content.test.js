const {expect} = require('../../helpers/test-setup');
const cheerio = require('cheerio');

describe('Search Content Model', () => {
  let searchContent;

  before(() => {
    searchContent = require('../../../src/models/search-content');
  });

  describe('searchContent', () => {
    it('should extract all fields from a valid element', () => {
      const html = `
        <div>
          <span class="truncate italic">Author Name</span>
          <img src="https://example.com/cover.jpg" />
          <a href="/md5/abc123def456">
            <h3>Test Book Title</h3>
          </a>
        </div>`;
      const $ = cheerio.load(html);
      const result = searchContent($('div').first());

      expect(result.authors).to.equal('Author Name');
      expect(result.coverUrl).to.equal('https://example.com/cover.jpg');
      expect(result.md5).to.equal('abc123def456');
      expect(result.title).to.equal('Test Book Title');
    });

    it('should strip /md5/ prefix from href to get md5', () => {
      const html = `
        <div>
          <span class="truncate italic"></span>
          <a href="/md5/deadbeef"><h3>Title</h3></a>
        </div>`;
      const $ = cheerio.load(html);
      const result = searchContent($('div').first());

      expect(result.md5).to.equal('deadbeef');
    });

    it('should return empty string for authors when element is missing', () => {
      const html = `
        <div>
          <a href="/md5/abc123"><h3>Title</h3></a>
        </div>`;
      const $ = cheerio.load(html);
      const result = searchContent($('div').first());

      expect(result.authors).to.equal('');
    });

    it('should return undefined coverUrl when img is missing', () => {
      const html = `
        <div>
          <span class="truncate italic">Author</span>
          <a href="/md5/abc123"><h3>Title</h3></a>
        </div>`;
      const $ = cheerio.load(html);
      const result = searchContent($('div').first());

      expect(result.coverUrl).to.be.undefined;
    });

    it('should return empty string for title when h3 is missing', () => {
      const html = `
        <div>
          <span class="truncate italic">Author</span>
          <a href="/md5/abc123">No H3 Here</a>
        </div>`;
      const $ = cheerio.load(html);
      const result = searchContent($('div').first());

      expect(result.title).to.equal('');
    });

    it('should handle multiple authors in truncate italic element', () => {
      const html = `
        <div>
          <span class="truncate italic">Author One, Author Two</span>
          <a href="/md5/abc123"><h3>Title</h3></a>
        </div>`;
      const $ = cheerio.load(html);
      const result = searchContent($('div').first());

      expect(result.authors).to.equal('Author One, Author Two');
    });
  });
});
