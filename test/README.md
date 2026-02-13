# Tests

This project uses **Mocha** + **Chai** + **Sinon** for unit tests, with **NYC** enforcing 90% line coverage per file. Legacy integration scripts are also included for manual fast-download-service verification.

## Running Tests

### Unit tests (primary)

```bash
npm test
```

This runs all `test/**/*.js` files recursively via Mocha and:
- Enforces **90% line coverage per file** via NYC
- Generates an HTML coverage report in `coverage/`
- Generates a JUnit XML report in `reports/mocha/test-results.xml`
- Timeout: 10 seconds per test

### Linting

```bash
npm run lint
```

### Legacy integration tests (manual)

```bash
node test/run-all-tests.js
```

## Directory Structure

```
test/
├── README.md
├── helpers/
│   └── test-setup.js                # Shared Sinon sandbox + Chai expect
├── fixtures/
│   ├── sample-settings.json
│   ├── sample-recent-searches.json
│   └── sample-files/
│       ├── test-book.pdf
│       └── test-doc.epub
├── unit/
│   ├── logger.test.js               # Winston logger config
│   ├── recent-searches.test.js      # Recent searches manager
│   ├── downloads-route.test.js      # Format utils + path traversal
│   ├── access-middleware.test.js     # Access logging middleware
│   └── helpers/
│       ├── search-helper.test.js    # Search URL building + HTML parsing
│       ├── file-helper.test.js      # Directory setup + file writing
│       ├── axios-helper.test.js     # HTTP GET + stream downloads
│       └── download-helper.test.js  # Download orchestration + source fallback
├── run-all-tests.js                 # Legacy: runs integration tests
├── test-service.js                  # Legacy: fast-download-service checks
├── test-download-helper.js          # Legacy: download-helper checks
├── test-integration.js              # Legacy: ArchiveOfAnna class checks
└── verify-integration.js            # Legacy: fast-download verification
```

## Test Setup (test/helpers/test-setup.js)

All unit tests share a common setup module that provides:
- `sinon`, `chai`, `expect` — imported once, reused everywhere
- `getSandbox()` — returns a Sinon sandbox that is automatically created in `beforeEach` and restored in `afterEach`

Usage:

```js
const {expect, getSandbox} = require('../helpers/test-setup');

describe('MyModule', () => {
  it('should do something', () => {
    const stub = getSandbox().stub(dependency, 'method').returns('value');
    // ...
    expect(result).to.equal('value');
  });
});
```

## Writing New Tests

- Place unit tests in `test/unit/`, matching the source file structure (e.g. `src/helpers/foo.js` → `test/unit/helpers/foo.test.js`)
- Import `test-setup.js` for Sinon sandboxing — no manual sandbox management needed
- Use `expect` style assertions (Chai)
- Stub external dependencies with `getSandbox().stub()`
- Add fixture files to `test/fixtures/` as needed

## Coverage

NYC enforces **90% line coverage per file**. After running `npm test`, open `coverage/index.html` in a browser to view the detailed HTML report.

## Testing Framework Summary

| Component | Tool | Description |
|-----------|------| ----------- |
| Test Runner | Mocha v10.1.0 | Backend testing organizer | 
| Coverage | NYC v15.1.0 (90% line coverage required) | Generates and manages code coverage reports |
| Assertions | Chai v4.3.6 | Write BDD and TDD validations | 
| Mocking | Sinon v21.0.1 | Unit testing simulator | 
| E2E | Playwright v1.58.2 | Full end2end testing, primarily used for frontend validations |

Commands
- npm test - Unit tests + coverage (includes test/verify-integration.js)
- npm run test:e2e - Playwright E2E tests
- npm run test:all - Full suite (unit + E2E)

Test Structure
- test/unit/ - Unit tests (models, helpers, services, routes)
- test/e2e/ - Playwright E2E tests
- test/verify-integration.js - Integration verification

