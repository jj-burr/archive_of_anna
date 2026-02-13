# Archive Of Anna (previously Zlibrary)

Unofficial JavaScript client library and web interface for [Anna's Archive](https://annas-archive.li). Provides programmatic search, metadata fetching, and file downloads from shadow library sources. Can be used as an imported npm module **or** run as a standalone web application.

## Features

- **Search** Anna's Archive by keyword, language, content type, file extension, and sort order
- **Fetch metadata** for any item by MD5 hash
- **Download files** via IPFS, Library Genesis mirrors, or the Fast Download API
- **Web UI** with search, one-click downloads, and configurable settings
- **Docker support** for containerized deployment

## Installation

```bash
git clone https://github.com/shettytejas/archive_of_anna.git
cd archive_of_anna
npm install
```

### Environment

Create `src/config/.env` with your settings:

```env
SECRET_KEY=your_annas_archive_secret_key   # required for Fast Download API
DOWNLOAD_PATH=./downloads/                  # optional, defaults to ./tmp/
```

The Fast Download API (`/dyn/api/fast_download.json`) requires a valid `SECRET_KEY`. Without one, downloads fall back to scraping the MD5 page.

## Usage

### As a library

```js
const ArchiveOfAnna = require('archive_of_anna');

// Search
const results = await ArchiveOfAnna.search('machine learning', 'en', '', 'pdf');
// => [{ authors, coverUrl, md5, title }, ...]

// Fetch metadata by MD5
const content = await ArchiveOfAnna.fetchByMd5('d41d8cd98f00b204e9800998ecf8427e');
// => { title, authors, downloadLinks, extension, isbnCodes }

// Download by MD5 (uses Fast Download API with scraping fallback)
await ArchiveOfAnna.downloadByMd5('d41d8cd98f00b204e9800998ecf8427e');

// Download via IPFS links
await ArchiveOfAnna.downloadFileViaIpfs(content.downloadLinks.ipfs);

// Download via Library Genesis mirrors
await ArchiveOfAnna.downloadFileViaLibgen(content.downloadLinks, 'libgenRsFork');

// Get IPFS links for an MD5
const ipfsLinks = await ArchiveOfAnna.getIpfsLinksByMd5('d41d8cd98f00b204e9800998ecf8427e');

// Get all download URLs for an MD5
const urls = await ArchiveOfAnna.getDownloadUrlsByMd5('d41d8cd98f00b204e9800998ecf8427e');

// Get all available download sources with counts
const sources = await ArchiveOfAnna.getAllDownloadSources('d41d8cd98f00b204e9800998ecf8427e');
// => { ipfs: { count, urls }, libgenRsFork: { count, urls }, libgenLiFork: { count, urls }, total }
```

### As a web application

```bash
npm start
# => http://localhost:3000
```

The web UI provides:
- **/search** -- Search form with filters for language, content type, extension, and sort
- **/download** -- One-click downloads from search results using the configured source
- **/settings** -- Configure download path and preferred download source
- **/download/status** -- JSON endpoint for polling download progress

### With Docker

```bash
docker build -t archive-of-anna .
docker run -p 3000:3000 -e SECRET_KEY=your_key -v ./downloads:/app/downloads archive-of-anna
```

## Architecture

```
index.js                          # Entry point, exports ArchiveOfAnna class
├── src/archive-of-anna.js        # Main API class (all static methods)
│    ├── src/helpers/search-helper.js      # URL building + HTML parsing for search
│    ├── src/helpers/download-helper.js    # Download orchestration, source selection
│    │    ├── src/helpers/axios-helper.js  # HTTP client with progress tracking
│    │    ├── src/helpers/file-helper.js   # File system write + directory setup
│    │    └── src/services/fast-download-service.js  # Fast Download JSON API
│    ├── src/helpers/cheerio-helper.js     # HTML parsing wrapper
│    ├── src/models/search-content.js      # Search result data mapper
│    ├── src/models/fetch-content.js       # Content detail data mapper
│    ├── src/interface/download-progress.js # Progress tracking
│    ├── src/store.js                      # In-memory state (download progress)
│    ├── src/constants.js                  # Base URLs, paths, API endpoints
│    └── src/config/index.js              # Loads .env (SECRET_KEY, DOWNLOAD_PATH)
├── web/server.js                 # Express web server (EJS views)
│    └── web/views/               # EJS templates (search, settings, download-status)
├── test/                         # Mocha + NYC test suite
└── Dockerfile                    # Docker image (node:20-alpine)
```

**Two download paths exist:**
1. **Fast Download API** -- JSON endpoint at `/dyn/api/fast_download.json` requiring a secret key; returns structured download URLs
2. **Web scraping fallback** -- parses HTML from Anna's Archive pages using Cheerio when the API is unavailable

Download sources include IPFS, LibGen (RS/LI forks), and Z-Library Tor.

## Development

```bash
# Install dependencies
npm install

# Run the test suite (Mocha + NYC, requires 90% line coverage per file)
npm test

# Run linting (ESLint with Google style guide)
npm run lint

# Start the web server in development
npm start
```

There is no build step -- this is vanilla Node.js.

### Code style

- Google ESLint config, 2-space indent, single quotes, trailing commas, semicolons
- Max line length: 140 characters
- Prettier configured (see `.prettierrc.json`)

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/shettytejas/archive_of_anna. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [code of conduct](https://github.com/shettytejas/archive_of_anna/blob/master/CODE_OF_CONDUCT.md).

## License

The library is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

