module.exports = {
  BASE_URI: 'https://annas-archive.li',
  DOWNLOAD_PATH: './tmp/',
  PATH_PREFIXES: {
    MD5: '/md5/',
  },
  FAST_DOWNLOAD_API: '/dyn/api/fast_download.json?md5={MD5}&KEY={SECRET_KEY}'
};
