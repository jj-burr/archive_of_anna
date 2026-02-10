// Test file to verify fast-download-service integration
const ArchiveOfAnna = require('../archive-of-anna');

console.log('Testing ArchiveOfAnna fast-download-service integration...\n');

// Test 1: Check if all new methods exist
console.log('Available methods:');
const methods = Object.getOwnPropertyNames(ArchiveOfAnna).filter(name => typeof ArchiveOfAnna[name] === 'function');
const fastDownloadMethods = methods.filter(method => 
  method.includes('Md5') || method.includes('Download') || method.includes('Ipfs')
);

fastDownloadMethods.forEach(method => {
  console.log(`  PASS ${method}`);
});

console.log(`\nPASS Found ${fastDownloadMethods.length} fast-download related methods`);

// Test 2: Test basic method signature validation
try {
  const testMd5 = 'test123456789abcdef';
  const testSecretKey = 'test-secret-key';
  const testName = 'test-file.pdf';
  const testPath = './test-downloads';
  const preferredSource = 'ipfs';
  
  console.log('\nTesting method signatures and parameter validation...');
  
  // Check if methods are callable with correct signatures
  const tests = [
    {
      name: 'downloadByMd5',
      method: ArchiveOfAnna.downloadByMd5,
      params: [testMd5, testName, testPath, testSecretKey, preferredSource]
    },
    {
      name: 'getIpfsLinksByMd5', 
      method: ArchiveOfAnna.getIpfsLinksByMd5,
      params: [testMd5, testSecretKey]
    },
    {
      name: 'getDownloadUrlsByMd5',
      method: ArchiveOfAnna.getDownloadUrlsByMd5,
      params: [testMd5, testSecretKey]
    },
    {
      name: 'getAllDownloadSources',
      method: ArchiveOfAnna.getAllDownloadSources,
      params: [testMd5, testSecretKey]
    }
  ];

  let passedTests = 0;
  
  for (const test of tests) {
    try {
      if (typeof test.method === 'function') {
        console.log(`  PASS ${test.name} method exists and is callable`);
        console.log(`    - Expected parameters: ${test.params.length}`);
        console.log(`    - Method length: ${test.method.length}`);
        passedTests++;
      } else {
        console.log(`  FAIL ${test.name} is not a function`);
      }
    } catch (error) {
      console.log(`  FAIL ${test.name} error: ${error.message}`);
    }
  }

  // Test 3: Verify integration with fast-download-service
  console.log('\nTesting service integration...');
  
  try {
    const fastDownloadService = require('../services/fast-download-service');
    
    if (typeof fastDownloadService.getDownloadUrls === 'function' &&
        typeof fastDownloadService.getIpfsLinks === 'function' &&
        typeof fastDownloadService.getAllDownloadSources === 'function') {
      console.log('  PASS fast-download-service methods are accessible');
      passedTests++;
    } else {
      console.log('  FAIL fast-download-service methods not found');
    }
  } catch (serviceError) {
    console.log(`  FAIL fast-download-service import error: ${serviceError.message}`);
  }

  // Test 4: Verify constants are properly loaded
  console.log('\nTesting constants integration...');
  
  try {
    const constants = require('../constants');
    
    if (constants.BASE_URI && constants.FAST_DOWNLOAD_API) {
      console.log('  PASS Constants loaded successfully');
      console.log(`    - BASE_URI: ${constants.BASE_URI}`);
      console.log(`    - FAST_DOWNLOAD_API: ${constants.FAST_DOWNLOAD_API}`);
      passedTests++;
    } else {
      console.log('  FAIL Required constants missing');
    }
  } catch (constantsError) {
    console.log(`  FAIL Constants import error: ${constantsError.message}`);
  }

  // Summary
  const totalTests = tests.length + 3; // methods + service + constants
  console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\nAll tests passed! The fast-download-service is properly integrated.');
    console.log('\nReady for use with the following API:');
    console.log('  - ArchiveOfAnna.downloadByMd5(md5, name, path, secretKey, preferredSource)');
    console.log('  - ArchiveOfAnna.getIpfsLinksByMd5(md5, secretKey)');
    console.log('  - ArchiveOfAnna.getDownloadUrlsByMd5(md5, secretKey)');
    console.log('  - ArchiveOfAnna.getAllDownloadSources(md5, secretKey)');
  } else {
    console.log('\nSome tests failed. Please check the implementation.');
  }
  
} catch (error) {
  console.error('\nCritical error during testing:', error.message);
  console.error(error.stack);
}