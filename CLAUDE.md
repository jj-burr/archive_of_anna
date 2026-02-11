# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unofficial JavaScript client library/wrapper for Anna's Archive (annas-archive.li). Provides programmatic search, metadata fetching, and file downloads from shadow library sources. Used as an imported npm module, not a standalone server.

## Commands

```bash
# Install dependencies
npm install

# Run full test suite (Mocha + NYC, requires 90% line coverage per file)
npm test

# Run linting (ESLint with Google style guide)
npm run lint

# Run integration tests manually
node test/run-all-tests.js
```

There is no build step -- this is vanilla Node.js.

## Architecture

```
index.js                          # Entry point, exports ArchiveOfAnna class
└── src/archive-of-anna.js        # Main API class (all static methods, no instantiation)
     ├── src/helpers/search-helper.js      # URL building + HTML parsing for search
     ├── src/helpers/download-helper.js    # Download orchestration, source selection
     │    ├── src/helpers/axios-helper.js  # HTTP client with progress tracking
     │    ├── src/helpers/file-helper.js   # File system write + directory setup
     │    └── src/services/fast-download-service.js  # Fast Download JSON API
     ├── src/helpers/cheerio-helper.js     # HTML parsing wrapper
     ├── src/models/search-content.js      # Search result data mapper
     ├── src/models/fetch-content.js       # Content detail data mapper
     ├── src/interface/download-progress.js # Progress tracking
     ├── src/store.js                      # In-memory state (download progress)
     ├── src/constants.js                  # Base URLs, paths, API endpoints
     └── src/config/index.js               # Loads .env (SECRET_KEY, DOWNLOAD_PATH)
```

**Two download paths exist:**
1. **Web scraping** -- parses HTML from Anna's Archive pages using Cheerio
2. **Fast Download API** -- JSON endpoint at `/dyn/api/fast_download.json` requiring a secret key; falls back to scraping if unavailable

## Key Patterns

- `ArchiveOfAnna` is a static-only class -- constructor throws an error. All public methods are `static async`.
- Download sources include IPFS, LibGen (RS/LI forks), and Z-Library Tor. Tor downloads are not yet implemented (throws error).
- `fast-download-service.js` fetches download URLs from the JSON API or falls back to scraping the MD5 page.
- Search results are parsed from HTML with Cheerio and mapped through model classes.

## Code Style

- Google ESLint config, 2-space indent, single quotes, trailing commas, semicolons
- Max line length: 140 characters
- Prettier configured (see `.prettierrc.json`)
- JSHint configured for ES6

## Environment

The Fast Download API requires `SECRET_KEY` in `src/config/.env`. `DOWNLOAD_PATH` defaults to `./downloads/`.

## Branches

- `master` -- main branch
- `fast_download_api` -- active feature branch adding the Fast Download API integration
