const { expect, getSandbox } = require('../../helpers/test-setup');
const logger = require('../../../web/logger');

describe('Search Helper', () => {
  let searchHelper;

  before(() => {
    searchHelper = require('../../../src/helpers/search-helper');
  });

  describe('buildSearchUrl', () => {
    let debugSpy;

    beforeEach(() => {
      debugSpy = getSandbox().stub(logger, 'debug');
    });

    it('should build a basic search URL with query only', () => {
      const url = searchHelper.buildSearchUrl('test query', '', '', '', '');

      expect(url.toString()).to.equal('https://annas-archive.li/search?q=test+query');
      expect(debugSpy.calledOnce).to.be.true;
      expect(debugSpy.firstCall.args[0]).to.equal('Search URL built');
      expect(debugSpy.firstCall.args[1]).to.deep.include({
        query: 'test query',
        lang: '',
        content: '',
        ext: '',
        sort: '',
      });
      expect(debugSpy.firstCall.args[1].finalUrl).to.equal('https://annas-archive.li/search?q=test+query');
    });

    it('should match example query format for "red rising"', () => {
      const url = searchHelper.buildSearchUrl('red rising', '', '', '', '');

      expect(url.toString()).to.equal('https://annas-archive.li/search?q=red+rising');
      expect(debugSpy.calledOnce).to.be.true;
      expect(debugSpy.firstCall.args[1].finalUrl).to.equal('https://annas-archive.li/search?q=red+rising');
    });

    it('should build URL with all parameters', () => {
      const url = searchHelper.buildSearchUrl('javascript', 'en', 'book', 'pdf', 'newest');

      expect(url.toString()).to.equal(
        'https://annas-archive.li/search?q=javascript&lang=en&content=book&ext=pdf&sort=newest',
      );
      expect(debugSpy.calledOnce).to.be.true;
      expect(debugSpy.firstCall.args[1]).to.deep.include({
        query: 'javascript',
        lang: 'en',
        content: 'book',
        ext: 'pdf',
        sort: 'newest',
      });
    });

    it('should handle URL encoding for special characters', () => {
      const url = searchHelper.buildSearchUrl('c++ programming', 'en', 'book', '', '');

      expect(url.toString()).to.include('q=c%2B%2B+programming');
      expect(debugSpy.calledOnce).to.be.true;
    });

    it('should handle empty parameters', () => {
      const url = searchHelper.buildSearchUrl('', '', '', '', '');

      expect(url.toString()).to.equal('https://annas-archive.li/search');
      expect(debugSpy.calledOnce).to.be.true;
    });

    it('should include only non-empty parameters', () => {
      const url = searchHelper.buildSearchUrl('javascript', 'en', '', '', 'newest');

      expect(url.toString()).to.equal('https://annas-archive.li/search?q=javascript&lang=en&sort=newest');
      expect(debugSpy.calledOnce).to.be.true;
    });

    it('should handle single parameter with others null', () => {
      const url = searchHelper.buildSearchUrl('python', null, null, null, null);

      expect(url.toString()).to.equal('https://annas-archive.li/search?q=python');
      expect(debugSpy.calledOnce).to.be.true;
    });
  });

  describe('collectContents', () => {
    it('should process valid HTML response with proper structure', () => {
      const mockHtml = `<body><main><div><form><div>
        <div class='min-w-[0] w-full'>
          <div class='bg-white px-2 rounded-tr-lg rounded-b-lg shadow-lg'>
            <div class='mb-2 sm:px-3'>
              <div>
                <div>
                  <div>
                    <a href='/md5/abc123' 
                       class='line-clamp-[3] overflow-hidden break-words js-vim-focus custom-a'>
                      Test Book Title
                    </a>
                    <div class='text-gray-800 dark:text-slate-400 font-semibold text-sm'>
                      English, PDF, 5.2MB, 2023, Book, Library Genesis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form></div></main></body>`;

      const result = searchHelper.collectContents(mockHtml);

      expect(result).to.be.an('array');
      expect(result.length).to.equal(1);
      expect(result[0]).to.deep.include({
        title: 'Book 1 Title',
        author: '',
        md5: 'def456',
        language: 'English',
        filetype: 'PDF',
      });
      expect(result[1]).to.deep.include({
        title: 'Book 2 Title',
        author: '',
        md5: 'ghi789',
        language: 'Spanish',
        filetype: 'EPUB',
      });
    });

    it('should handle empty results when no matching elements found', () => {
      const mockHtml = `<body><main><div><form><div>
        <div class='min-w-[0] w-full'>
          <div class='bg-white px-2 rounded-tr-lg rounded-b-lg shadow-lg'>
            <div class='mb-2 sm:px-3'>
              <div>
                <div>
                  <div>No search results here</div>
                </div>
              </div>
            </div>
          </div>
        </form></div></main></body>`;

      const result = searchHelper.collectContents(mockHtml);

      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });

    it('should parse metadata correctly from various formats', () => {
      const mockHtml = `<body><main><div><form><div>
        <div class='min-w-[0] w-full'>
          <div class='bg-white px-2 rounded-tr-lg rounded-b-lg shadow-lg'>
            <div class='mb-2 sm:px-3'>
              <div>
                <div>
                  <div>
                    <a href='/md5/abc123' 
                       class='line-clamp-[3] overflow-hidden break-words js-vim-focus custom-a'>
                      Advanced Programming
                    </a>
                    <div class='text-gray-800 dark:text-slate-400 font-semibold text-sm'>
                      Russian, PDF, 15.7MB, 2021, Book, Z-Library
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form></div></main></body>`;

      const result = searchHelper.collectContents(mockHtml);

      expect(result).to.be.an('array');
      expect(result.length).to.equal(1);
      expect(result[0]).to.deep.include({
        title: 'Advanced Programming',
        author: '',
        md5: 'abc123',
        language: 'Russian',
        filetype: 'PDF',
        size: '15.7MB',
        year: '2021',
        contentType: 'Book',
        source: 'Z-Library',
      });
    });

    it('should parse author from specified selector', () => {
      const mockHtml = `<body><main><div><form><div>
        <div class='min-w-[0] w-full'>
          <div class='bg-white px-2 rounded-tr-lg rounded-b-lg shadow-lg'>
            <div class='mb-2 sm:px-3'>
              <div>
                <div>
                  <div>
                    <a href='/md5/def456' 
                       class='line-clamp-[3] overflow-hidden break-words js-vim-focus custom-a'>
                      Programming Fundamentals
                    </a>
                    <div>
                      Pierce Brown
                    </div>
                    <div class='text-gray-800 dark:text-slate-400 font-semibold text-sm'>
                      English, PDF, 8.5MB, 2020, Book, Library Genesis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form></div></main></body>`;

      const result = searchHelper.collectContents(mockHtml);

      expect(result).to.be.an('array');
      expect(result.length).to.equal(1);
      expect(result[0]).to.deep.include({
        title: 'Programming Fundamentals',
        md5: 'def456',
        author: 'Pierce Brown',
        language: 'English',
        filetype: 'PDF',
        size: '8.5MB',
        year: '2020',
        contentType: 'Book',
        source: 'Library Genesis',
      });
    });
  });

  describe('buildFetchUrl', () => {
    it('should build URL with MD5 path when not prefixed', () => {
      const url = searchHelper.buildFetchUrl('abc123def456');

      expect(url.toString()).to.equal('https://annas-archive.li/md5/abc123def456');
    });

    it('should build URL when MD5 path already prefixed', () => {
      const url = searchHelper.buildFetchUrl('/md5/abc123def456');

      expect(url.toString()).to.equal('https://annas-archive.li/md5/abc123def456');
    });

    it('should handle empty MD5 path', () => {
      const url = searchHelper.buildFetchUrl('');
      expect(url.toString()).to.equal('https://annas-archive.li/md5/');
    });

    it('should handle null MD5 path', () => {
      expect(() => searchHelper.buildFetchUrl(null)).to.throw();
    });

    it('should handle undefined MD5 path', () => {
      expect(() => searchHelper.buildFetchUrl(undefined)).to.throw();
    });
  });

  describe('getContent', () => {
    it('should process valid HTML response with proper structure', () => {
      const mockHtml = `
        <html>
          <body>
            <main>
              <div class="js-technical-details hidden">
                <div>
                  <div>
                    {
                      "md5": "abc123", 
                      "file_unified_data": {
                        "title_best": "Test Title", 
                        "author_best": "Test Author", 
                        "year_best": "2023", 
                        "publisher_best": "Test Publisher", 
                        "extension_best": "pdf", 
                        "cover_url_best": "/cover.jpg", 
                        "stripped_description_best": "Test description", 
                        "author_additional": [], 
                        "sanitized_isbns": ["1234567890"]
                      }, 
                      "additional": {
                        "download_urls": [
                          ["IPFS", "ipfs://test"], 
                          ["Libgen.rs-fork", "http://libgen.rs/test.pdf"]
                        ]
                      }
                    }
                  </div>
                </div>
              </div>
            </main>
          </body>
        </html>
      `;

      const result = searchHelper.getContent(mockHtml);

      expect(result).to.be.an('object');
      expect(result).to.deep.include({
        md5: 'abc123',
        title: 'Test Title',
        extension: 'pdf',
        year: 2023,
        publisher: 'Test Publisher',
        description: 'Test description',
        coverUrl: '/cover.jpg',
      });
      expect(result.authors).to.include('Test Author');
    });

    it('should throw error for null response', () => {
      expect(() => searchHelper.getContent(null))
        .to.throw('Invalid fetch response: Non-string response received');
    });

    it('should throw error for undefined response', () => {
      expect(() => searchHelper.getContent(undefined))
        .to.throw('Invalid fetch response: Non-string response received');
    });

    it('should throw error for non-string response', () => {
      expect(() => searchHelper.getContent(123))
        .to.throw('Invalid fetch response: Non-string response received');
    });

    it('should throw error for empty string response', () => {
      expect(() => searchHelper.getContent(''))
        .to.throw('Invalid fetch response: Empty HTML content received');
    });

    it('should throw error for whitespace-only response', () => {
      expect(() => searchHelper.getContent('   \n\t  '))
        .to.throw('Invalid fetch response: Empty HTML content received');
    });
  });
});
