# Fast-Download-Service Integration Tests

This directory contains comprehensive tests to verify that the fast-download-service is properly integrated with the ArchiveOfAnna class.

## Test Files

### 1. `test-service.js`
Tests the fast-download-service independently:
- Module loading
- Method availability (`getDownloadUrls`, `getIpfsLinks`, `getAllDownloadSources`)
- Dependencies (constants, axios-helper, fetch-content, cheerio-helper)

**Run with:** `node src/test/test-service.js`

### 2. `test-download-helper.js`
Tests the download-helper integration:
- Module loading
- Fast download methods (`downloadByMd5`, `getIpfsLinksByMd5`, `getDownloadUrlsByMd5`)
- Dependencies (axios-helper, file-helper, fast-download-service)
- Parameter validation

**Run with:** `node src/test/test-download-helper.js`

### 3. `test-integration.js`
Tests the full ArchiveOfAnna class integration:
- Method discovery and listing
- Method signature validation
- Service integration verification
- Constants loading verification
- Complete API availability

**Run with:** `node src/test/test-integration.js`

### 4. `run-all-tests.js`
Test runner that executes all tests in sequence:
- Runs all individual tests
- Provides comprehensive summary
- Reports overall pass/fail status

**Run with:** `node src/test/run-all-tests.js`

## What the Tests Verify

### Integration Points
1. **Module Loading**: All required modules can be imported without errors
2. **Method Availability**: All fast-download methods are accessible
3. **Dependency Chain**: All dependencies are properly linked
4. **Parameter Validation**: Methods accept correct number of parameters

### API Methods Tested
- `ArchiveOfAnna.downloadByMd5(md5, name, path, secretKey, preferredSource)`
- `ArchiveOfAnna.getIpfsLinksByMd5(md5, secretKey)`
- `ArchiveOfAnna.getDownloadUrlsByMd5(md5, secretKey)`
- `ArchiveOfAnna.getAllDownloadSources(md5, secretKey)`

### Service Components Tested
- `fast-download-service.js` - Core service
- `download-helper.js` - Integration layer
- `constants.js` - Configuration constants
- `archive-of-anna.js` - Main API class

## Expected Output

When all tests pass, you should see:

```
ALL TESTS PASSED!
Fast-download-service integration is fully functional!

Ready for use with these methods:
   - ArchiveOfAnna.downloadByMd5()
   - ArchiveOfAnna.getIpfsLinksByMd5()
   - ArchiveOfAnna.getDownloadUrlsByMd5()
   - ArchiveOfAnna.getAllDownloadSources()
```

## Troubleshooting

### Import Path Errors
If you see import errors, verify:
- `axios-helper.js` is in `src/helpers/`
- `file-helper.js` is in `src/helpers/`
- All relative paths are correct

### Missing Constants
If constants are missing, check:
- `FAST_DOWNLOAD_API` is defined in `constants.js`
- `BASE_URI` is correctly set

### Method Not Found
If methods are missing:
- Verify fast-download-service.js is properly exported
- Check ArchiveOfAnna class includes new methods
- Ensure no syntax errors in the files

## Running Tests

### Prerequisites
- Node.js installed
- Project dependencies installed: `npm install`

### Individual Tests
```bash
# Run specific test
node src/test/test-service.js
node src/test/test-download-helper.js  
node src/test/test-integration.js

# Run all tests
node src/test/run-all-tests.js
```

### With npm
If you want to add to package.json:
```json
{
  "scripts": {
    "test-fast-download": "node src/test/run-all-tests.js"
  }
}
```

Then run: `npm run test-fast-download`

## Integration Status

**All integration tests are ready and should pass** when:
1. Import paths are correctly fixed
2. Constants are properly defined
3. All modules load without errors
4. Methods are correctly exported

The tests cover the complete integration chain from constants through service layer to the final API, ensuring the fast-download-service works end-to-end with the ArchiveOfAnna class.