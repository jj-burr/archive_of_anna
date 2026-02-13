const {expect} = require('../../helpers/test-setup');
const cheerio = require('cheerio');

describe('Fetch Content Model', () => {
  let fetchContent;

  before(() => {
    fetchContent = require('../../../src/models/fetch-content');
  });

  const buildHtml = (jsonMetadata) => {
    const jsonString = JSON.stringify(jsonMetadata);
    return `<main>
      <div class="js-technical-details hidden">
        <div><div>${jsonString}</div></div>
      </div>
    </main>`;
  };

  const baseMetadata = () => ({
    md5: 'abc123',
    file_unified_data: {
      title_best: 'Test Title',
      author_best: 'Default Author',
      author_additional: [],
      year_best: '2023',
      publisher_best: 'Test Publisher',
      extension_best: 'pdf',
      cover_url_best: 'https://example.com/cover.jpg',
      stripped_description_best: 'A test description',
      sanitized_isbns: ['9781234567890'],
    },
    additional: {
      download_urls: [
        ['Libgen.rs-fork', 'http://libgen.rs/file.pdf'],
        ['Libgen.li-fork', 'http://libgen.li/file.pdf'],
        ['IPFS', 'ipfs://Qm123'],
        ['Z-Library TOR', 'http://zlibrary.onion/file.pdf'],
      ],
    },
  });

  describe('valid JSON metadata', () => {
    it('should parse all fields correctly', () => {
      const html = buildHtml(baseMetadata());
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.md5).to.equal('abc123');
      expect(result.title).to.equal('Test Title');
      expect(result.publisher).to.equal('Test Publisher');
      expect(result.extension).to.equal('pdf');
      expect(result.coverUrl).to.equal('https://example.com/cover.jpg');
      expect(result.description).to.equal('A test description');
      expect(result.isbnCodes).to.deep.equal(['9781234567890']);
      expect(result.year).to.equal(2023);
    });
  });

  describe('download link segregation', () => {
    it('should categorize all download link types correctly', () => {
      const html = buildHtml(baseMetadata());
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.downloadLinks.libgenRsFork).to.deep.equal(['http://libgen.rs/file.pdf']);
      expect(result.downloadLinks.libgenLiFork).to.deep.equal(['http://libgen.li/file.pdf']);
      expect(result.downloadLinks.ipfs).to.deep.equal(['ipfs://Qm123']);
      expect(result.downloadLinks.zLibTor).to.deep.equal(['http://zlibrary.onion/file.pdf']);
    });

    it('should handle empty download_urls array', () => {
      const metadata = baseMetadata();
      metadata.additional.download_urls = [];
      const html = buildHtml(metadata);
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.downloadLinks.libgenRsFork).to.deep.equal([]);
      expect(result.downloadLinks.libgenLiFork).to.deep.equal([]);
      expect(result.downloadLinks.ipfs).to.deep.equal([]);
      expect(result.downloadLinks.zLibTor).to.deep.equal([]);
    });

    it('should ignore unrecognized download source names', () => {
      const metadata = baseMetadata();
      metadata.additional.download_urls = [
        ['Unknown Source', 'http://example.com/file.pdf'],
      ];
      const html = buildHtml(metadata);
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.downloadLinks.libgenRsFork).to.deep.equal([]);
      expect(result.downloadLinks.libgenLiFork).to.deep.equal([]);
      expect(result.downloadLinks.ipfs).to.deep.equal([]);
      expect(result.downloadLinks.zLibTor).to.deep.equal([]);
    });

    it('should handle multiple links per source type', () => {
      const metadata = baseMetadata();
      metadata.additional.download_urls = [
        ['IPFS Gateway 1', 'ipfs://Qm111'],
        ['IPFS Gateway 2', 'ipfs://Qm222'],
      ];
      const html = buildHtml(metadata);
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.downloadLinks.ipfs).to.deep.equal(['ipfs://Qm111', 'ipfs://Qm222']);
    });
  });

  describe('author handling', () => {
    it('should use author_best when author_additional is empty', () => {
      const html = buildHtml(baseMetadata());
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.authors).to.deep.equal(['Default Author']);
    });

    it('should use author_additional when populated', () => {
      const metadata = baseMetadata();
      metadata.file_unified_data.author_additional = ['Author One', 'Author Two'];
      const html = buildHtml(metadata);
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.authors).to.deep.equal(['Author One', 'Author Two']);
    });
  });

  describe('year parsing', () => {
    it('should convert string year to integer', () => {
      const html = buildHtml(baseMetadata());
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.year).to.be.a('number');
      expect(result.year).to.equal(2023);
    });

    it('should return NaN for non-numeric year', () => {
      const metadata = baseMetadata();
      metadata.file_unified_data.year_best = 'unknown';
      const html = buildHtml(metadata);
      const $ = cheerio.load(html);
      const result = fetchContent($('main'));

      expect(result.year).to.be.NaN;
    });
  });

  describe('malformed input', () => {
    it('should throw when JSON metadata is malformed', () => {
      const html = `<main>
        <div class="js-technical-details hidden">
          <div><div>not valid json {{{</div></div>
        </div>
      </main>`;
      const $ = cheerio.load(html);

      expect(() => fetchContent($('main'))).to.throw();
    });
  });
});
