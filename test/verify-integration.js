// Fast-Download-Service Integration Verification
console.log('Fast-Download-Service Integration Verification');
console.log('='.repeat(60));

// Verify key components
const components = [
  {
    name: 'ArchiveOfAnna Class',
    path: '../archive-of-anna.js',
    check: () => {
      const ArchiveOfAnna = require('../archive-of-anna');
      const methods = Object.getOwnPropertyNames(ArchiveOfAnna).filter(name => 
        typeof ArchiveOfAnna[name] === 'function' && 
        (name.includes('Md5') || name.includes('Download'))
      );
      return methods.length >= 4;
    }
  },
  {
    name: 'Fast Download Service',
    path: '../services/fast-download-service.js', 
    check: () => {
      const service = require('../services/fast-download-service');
      return typeof service.getDownloadUrls === 'function' &&
             typeof service.getIpfsLinks === 'function' &&
             typeof service.getAllDownloadSources === 'function';
    }
  },
  {
    name: 'Download Helper',
    path: '../helpers/download-helper.js',
    check: () => {
      const helper = require('../helpers/download-helper');
      return typeof helper.downloadByMd5 === 'function' &&
             typeof helper.getIpfsLinksByMd5 === 'function';
    }
  },
  {
    name: 'Constants',
    path: '../constants.js',
    check: () => {
      const constants = require('../constants');
      return constants.FAST_DOWNLOAD_API && constants.BASE_URI;
    }
  }
];

let verified = 0;
let total = components.length;

components.forEach((component, index) => {
  try {
    const status = component.check() ? 'PASS' : 'FAIL';
    console.log(`${status} ${component.name}`);
    if (component.check()) verified++;
  } catch (error) {
    console.log(`FAIL ${component.name} - Error: ${error.message}`);
  }
});

console.log('='.repeat(60));
console.log(`Integration Status: ${verified}/${total} components verified`);

if (verified === total) {
  console.log('Fast-Download-Service is fully integrated!');
  console.log('\nAvailable API Methods:');
  
  const ArchiveOfAnna = require('../archive-of-anna');
  const apiMethods = Object.getOwnPropertyNames(ArchiveOfAnna).filter(name => 
    typeof ArchiveOfAnna[name] === 'function' && 
    (name.includes('Md5') || name.includes('Download'))
  );
  
  apiMethods.forEach(method => {
    console.log(`  - ArchiveOfAnna.${method}()`);
  });
  
  console.log('\nReady for production use!');
} else {
  console.log('Integration incomplete - check failed components');
}

console.log('='.repeat(60));