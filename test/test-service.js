// Test fast-download-service independently
console.log('Testing fast-download-service standalone...\n');

try {
  // Test 1: Module loading
  const fastDownloadService = require('../src/services/fast-download-service');
  console.log('PASS fast-download-service loaded successfully');

  // Test 2: Method availability
  const requiredMethods = [
    'getDownloadUrls',
    'getIpfsLinks', 
    'getAllDownloadSources'
  ];

  let availableMethods = 0;
  requiredMethods.forEach(method => {
    if (typeof fastDownloadService[method] === 'function') {
      console.log(`PASS ${method} method available`);
      availableMethods++;
    } else {
      console.log(`FAIL ${method} method missing`);
    }
  });

  // Test 3: Dependencies
  console.log('\nTesting dependencies...');
  
  try {
    const { BASE_URI, FAST_DOWNLOAD_API } = require('../src/constants');
    console.log(`PASS Constants loaded: BASE_URI=${BASE_URI}`);
    console.log(`PASS FAST_DOWNLOAD_API template: ${FAST_DOWNLOAD_API}`);
  } catch (error) {
    console.log(`FAIL Constants error: ${error.message}`);
  }

  try {
    const axiosHelper = require('../src/helpers/axios-helper.js');
    console.log('PASS axios-helper loaded');
  } catch (error) {
    console.log(`FAIL axios-helper error: ${error.message}`);
  }

  try {
    const fetchContent = require('../src/models/fetch-content');
    console.log('PASS fetch-content model loaded');
  } catch (error) {
    console.log(`FAIL fetch-content error: ${error.message}`);
  }

  try {
    const cheerio = require('../src/helpers/cheerio-helper');
    console.log('PASS cheerio-helper loaded');
  } catch (error) {
    console.log(`FAIL cheerio-helper error: ${error.message}`);
  }

  // Summary
  console.log(`\nService Test Summary:`);
  console.log(`  - Methods available: ${availableMethods}/${requiredMethods.length}`);
  
  if (availableMethods === requiredMethods.length) {
    console.log('  fast-download-service is ready for use!');
  } else {
    console.log('  Some methods are missing');
  }

} catch (error) {
  console.error('Fast-download-service test failed:', error.message);
  console.error(error.stack);
}