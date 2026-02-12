const axiosHelper = require('./axios-helper');
const fileHelper = require('./file-helper');
const fastDownloadService = require('../services/fast-download-service');
const logger = require('../../web/logger');

const getSubstringIndicesForFilename = (contentDispositionHeader) => {
  const filenameHeader = 'filename="';
  const startIndex = contentDispositionHeader.indexOf(filenameHeader) + filenameHeader.length;
  const endIndex = contentDispositionHeader.indexOf('"', startIndex);

  return [startIndex, endIndex];
};

const getFileNameFromHeaders = (response) => {
  const contentDispositionHeader = response.headers['content-disposition'];
  const [startIndex, endIndex] = getSubstringIndicesForFilename(contentDispositionHeader);

  return contentDispositionHeader.substring(startIndex, endIndex);
};

const getFileExtensionFromHeaders = (response) => {
  const fileName = getFileNameFromHeaders(response);
  return fileName.substring(fileName.lastIndexOf('.') + 1);
};

const getCustomFileName = (name) => `${name}.${getFileExtensionFromHeaders(response)}`;

const getFileNameAndContent = async (name, link) => {
  const response = await axiosHelper.download(link, name);
  if (response.status != 200) return [null, null];

  const fileName = name ? getCustomFileName(name) : getFileNameFromHeaders(response);

  return [fileName, response.data];
};

const downloadFileFromGivenLinks = async (links, name, path) => {
  fileHelper.directorySetup(path); // Setup the download directory if it doesn't exist.

  for (const link of links) {
    const [fileName, content] = await getFileNameAndContent(name, link);

    if (!content) continue;

    return await fileHelper.writeFileToPath(path, fileName, content);
  }

  throw new Error('File could not be downloaded due to server error. Please try again later.');
};

const downloadHelper = {
  /**
   * Downloads a file using IPFS links
   * @param {Array} ipfsLinks - Array of IPFS URLs
   * @param {String} name - Optional custom name for the file
   * @param {String} path - Directory path to save the file
   * @return {Promise<String>} Path of the downloaded file
   */
  ipfs: async (ipfsLinks, name, path) => await downloadFileFromGivenLinks(ipfsLinks, name, path),

  /**
   * Downloads a file using Library Genesis links
   * @param {Array} libgenLinks - Array of LibGen URLs
   * @param {String} fork - Which fork ('rs' or 'li')
   * @param {String} name - Optional custom name for the file
   * @param {String} path - Directory path to save the file
   * @return {Promise<String>} Path of the downloaded file
   */
  libgenDownload: async (libgenLinks, fork, name, path) => await downloadFileFromGivenLinks(libgenLinks, name, path),

  /**
   * Downloads a file using Tor-based links (not implemented yet)
   * @param {Array} torLinks - Array of Tor URLs
   * @param {String} name - Optional custom name for the file
   * @param {String} path - Directory path to save the file
   */
  torDownload: async (torLinks, name, path) => {
    throw new Error('Tor download not yet implemented. Need to check if axios can be self-contained for Tor requests.');
  },

  /**
   * Downloads a file by MD5 hash using Fast Download API
   * @param {String} md5 - MD5 hash of the content
   * @param {String} name - Optional custom name for the file
   * @param {String} path - Directory path to save the file
   * @param {String} [preferredSource] - Preferred download source ('ipfs', 'libgenRsFork', 'libgenLiFork')
   * @return {Promise<String>} Path of the downloaded file
   */
  downloadByMd5: async (md5, name, path, preferredSource = 'ipfs') => {
    try {
      const downloadSources = await fastDownloadService.getAllDownloadSources(md5);

      if (downloadSources.total === 0) {
        throw new Error(`No download sources found for MD5: ${md5}`);
      }

      // Try preferred source first, then fallback to others in order
      const sources = [preferredSource, 'ipfs', 'libgenRsFork', 'libgenLiFork', 'zLibTor'];

      for (const source of sources) {
        const sourceData = downloadSources[source];
        if (sourceData && sourceData.count > 0) {
          try {
            return await downloadFileFromGivenLinks(sourceData.urls, name, path);
          } catch (error) {
            logger.warn(`Failed to download from ${source}, trying next source`, { source, error: error.message });
          }
        }
      }

      throw new Error(`All download sources failed for MD5: ${md5}`);
    } catch (error) {
      throw new Error(`MD5 download failed: ${error.message}`);
    }
  },

  /**
   * Gets IPFS links for a given MD5 hash
   * @param {String} md5 - MD5 hash of the content
   * @return {Promise<Array>} Array of IPFS URLs
   */
  getIpfsLinksByMd5: async (md5) => {
    return await fastDownloadService.getIpfsLinks(md5);
  },

  /**
   * Gets all download URLs for a given MD5 hash
   * @param {String} md5 - MD5 hash of the content
   * @return {Promise<Object>} Object with categorized download URLs
   */
  getDownloadUrlsByMd5: async (md5) => {
    return await fastDownloadService.getDownloadUrls(md5);
  },
};

module.exports = downloadHelper;
