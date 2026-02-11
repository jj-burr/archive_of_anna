// Test runner for all fast-download-service integration tests
console.log('Running all fast-download-service integration tests...\n');

const tests = [
  { name: 'Fast Download Service', file: 'test-service.js' },
  { name: 'Download Helper Integration', file: 'test-download-helper.js' },
  { name: 'ArchiveOfAnna Integration', file: 'test-integration.js' }
];

let totalTests = tests.length;
let passedTests = 0;

tests.forEach((test, index) => {
  console.log(`\n${index + 1}. Running ${test.name} tests...`);
  console.log('='.repeat(50));
  
  try {
    // Run the test file
    require(`./${test.file}`);
    console.log(`\n${test.name} tests completed`);
    passedTests++;
  } catch (error) {
    console.log(`\n${test.name} tests failed: ${error.message}`);
  }
  
  console.log('='.repeat(50));
});

// Final summary
console.log('\nFINAL TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Tests passed: ${passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('ALL TESTS PASSED!');
  console.log('Fast-download-service integration is fully functional!');
  console.log('\nReady for use with these methods:');
  console.log('   - ArchiveOfAnna.downloadByMd5()');
  console.log('   - ArchiveOfAnna.getIpfsLinksByMd5()');
  console.log('   - ArchiveOfAnna.getDownloadUrlsByMd5()');
  console.log('   - ArchiveOfAnna.getAllDownloadSources()');
} else {
  console.log('SOME TESTS FAILED');
  console.log('Please check the failed tests above for issues');
}

console.log('='.repeat(50));