const { BASE_URI, FAST_DOWNLOAD_API } = require('../constants');
const axiosHelper = require('../helpers/axios-helper');
const fetchContent = require('../models/fetch-content');
const cheerio = require('../helpers/cheerio-helper');

/**
 * Service to handle Fast Download API calls and extract download URLs
 */
const fastDownloadService = {
  /**
   * Gets download URLs using the Fast Download API
   * @param {String} md5 - The MD5 hash of the content
   * @param {String} [secretKey] - Optional secret key for API access
   * @return {Promise<Object>} Object containing categorized download URLs
   */
  getDownloadUrls: async (md5, secretKey = '') => {
    try {
      // If secret key is provided, use the Fast Download API
      if (secretKey) {
        const apiUrl = BASE_URI + FAST_DOWNLOAD_API
          .replace('{MD5}', md5)
          .replace('{SECRET_KEY}', secretKey);
        
        const response = await axiosHelper.get(apiUrl);
        
        if (response.status === 200 && response.data) {
          return response.data;
        }
      }
      
      // Fallback: scrape the content page for download URLs
      const contentPageUrl = `${BASE_URI}/md5/${md5}`;
      const response = await axiosHelper.get(contentPageUrl);
      
      if (response.status === 200 && response.data) {
        const $ = cheerio.load(response.data);
        const contentData = fetchContent($('main'));
        return contentData.downloadLinks;
      }
      
      throw new Error('Failed to fetch download URLs');
    } catch (error) {
      throw new Error(`Fast download failed for MD5 ${md5}: ${error.message}`);
    }
  },

  /**
   * Gets IPFS links specifically for a given MD5
   * @param {String} md5 - The MD5 hash of the content
   * @param {String} [secretKey] - Optional secret key for API access
   * @return {Promise<Array>} Array of IPFS URLs
   */
  getIpfsLinks: async (md5, secretKey = '') => {
    try {
      const downloadUrls = await fastDownloadService.getDownloadUrls(md5, secretKey);
      return downloadUrls.ipfs || [];
    } catch (error) {
      throw new Error(`Failed to get IPFS links for MD5 ${md5}: ${error.message}`);
    }
  },

  /**
   * Gets all available download sources for a given MD5
   * @param {String} md5 - The MD5 hash of the content
   * @param {String} [secretKey] - Optional secret key for API access
   * @return {Promise<Object>} Object with counts and URLs for each source type
   */
  getAllDownloadSources: async (md5, secretKey = '') => {
    try {
      const downloadUrls = await fastDownloadService.getDownloadUrls(md5, secretKey);
      
      return {
        ipfs: {
          count: downloadUrls.ipfs?.length || 0,
          urls: downloadUrls.ipfs || []
        },
        libgenRsFork: {
          count: downloadUrls.libgenRsFork?.length || 0,
          urls: downloadUrls.libgenRsFork || []
        },
        libgenLiFork: {
          count: downloadUrls.libgenLiFork?.length || 0,
          urls: downloadUrls.libgenLiFork || []
        },
        zLibTor: {
          count: downloadUrls.zLibTor?.length || 0,
          urls: downloadUrls.zLibTor || []
        },
        total: (downloadUrls.ipfs?.length || 0) + 
               (downloadUrls.libgenRsFork?.length || 0) + 
               (downloadUrls.libgenLiFork?.length || 0) + 
               (downloadUrls.zLibTor?.length || 0)
      };
    } catch (error) {
      throw new Error(`Failed to get download sources for MD5 ${md5}: ${error.message}`);
    }
  }
};

module.exports = fastDownloadService;