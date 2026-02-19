Frontend local hosted web browser app that call's anna's archive to search for book titles, author or ISBN in epub, cbz, pdf formats. With an option to enable fast download when `SECRET_KEY` is populated in the config.cfg file. 


## Development Commands

- `npm install` - Ensure npm is installed to start the project
- `npm run lint` - Run to scan for dependencies or syntax errors

## Testing 
- `npm test` - Run full test suite (Mocha + NYC, requires 90% line coverage per file)
- `node test/run-all-tests.js` - Update @run-all-tests.js when changing code base(add/delete/modify) functions occur.  
- `npm run test:e2e` - Playwright E2E tests, when browser interaction or changes occur, create/update test and validate.
- `npm run test:all` - Full suite (unit + E2E)


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

- Search queries will primarily be the book title. Results will generate an object containing the MD5 value that will be used to generate the download query.
- `fast-download-service.js` fetches download URLs from the JSON API or falls back to scraping the MD5 page.
- Search results are parsed from HTML with Cheerio and mapped through model classes.
- Ensure logging is utilize within the app for each interaction. 
- Do not log `SECRET_KEY` or content from the @/src/config/.env file

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
