// Test download-helper integration with fast-download-service
console.log('Testing download-helper integration...\n');

try {
  // Test 1: Module loading
  const downloadHelper = require('../src/helpers/download-helper');
  console.log('download-helper loaded successfully');

  // Test 2: Fast download methods availability
  const fastDownloadMethods = [
    'downloadByMd5',
    'getIpfsLinksByMd5',
    'getDownloadUrlsByMd5'
  ];

  let availableMethods = 0;
  fastDownloadMethods.forEach(method => {
    if (typeof downloadHelper[method] === 'function') {
      console.log(`${method} method available`);
      availableMethods++;
    } else {
      console.log(`${method} method missing`);
    }
  });

  // Test 3: Dependencies
  console.log('\nTesting download-helper dependencies...');
  
  try {
    const axiosHelper = require('../src/helpers/axios-helper');
    console.log('axios-helper loaded');
  } catch (error) {
    console.log(`axios-helper error: ${error.message}`);
  }

  try {
    const fileHelper = require('../src/helpers/file-helper');
    console.log('file-helper loaded');
  } catch (error) {
    console.log(`file-helper error: ${error.message}`);
  }

  try {
    const fastDownloadService = require('../src/services/fast-download-service');
    console.log('fast-download-service loaded');
  } catch (error) {
    console.log(`fast-download-service error: ${error.message}`);
  }

  // Test 4: Method parameter validation
  console.log('\nTesting method parameter validation...');
  
  if (availableMethods === fastDownloadMethods.length) {
    try {
      // Test parameter counts
      console.log(`downloadByMd5 expects ${downloadHelper.downloadByMd5.length} parameters`);
      console.log(`getIpfsLinksByMd5 expects ${downloadHelper.getIpfsLinksByMd5.length} parameters`);
      console.log(`getDownloadUrlsByMd5 expects ${downloadHelper.getDownloadUrlsByMd5.length} parameters`);
    } catch (error) {
      console.log(`Parameter validation error: ${error.message}`);
    }
  }

  // Summary
  console.log(`\nDownload-Helper Test Summary:`);
  console.log(`  - Fast download methods: ${availableMethods}/${fastDownloadMethods.length}`);
  
  if (availableMethods === fastDownloadMethods.length) {
    console.log('  download-helper integration is ready!');
  } else {
    console.log('   Some integration methods are missing');
  }

} catch (error) {
  console.error('Download-helper test failed:', error.message);
  console.error(error.stack);
}