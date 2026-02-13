const {
  BASE_URI,
  PATH_PREFIXES: { MD5 },
} = require('../constants');
const cheerio = require('../helpers/cheerio-helper');
const fetchContent = require('../models/fetch-content');
const logger = require('../../web/logger');

/**
 * Parses metadata text into structured object
 * @param {String} metadataText - The metadata text to parse
 * @return {Object} Parsed metadata object with language, filetype, size, year,
 * contentType, source
 */
const parseMetadata = (metadataText) => {
  const metadata = {
    language: '',
    filetype: '',
    size: '',
    year: '',
    contentType: '',
    source: '',
  };

  if (!metadataText) {
    return metadata;
  }

  // First, check for known multi-word sources before splitting
  let source = '';
  const knownSources = [
    'Library Genesis',
    'Z-Library',
    'Internet Archive',
    'Project Gutenberg',
    'Sci-Hub',
  ];

  for (const knownSource of knownSources) {
    if (metadataText.includes(knownSource)) {
      source = knownSource;
      // Remove the source from the text for further processing
      metadataText = metadataText.replace(knownSource, '').trim();
      break;
    }
  }

  // Split by common separators and clean up
  const parts = metadataText.split(/[\s•·,\|]/).map((part) => part.trim())
    .filter((part) => part.length > 0);

  parts.forEach((part) => {
    // Check in order of specificity to avoid misidentification
    // Size detection (contains numbers and size units) - most specific
    if (isSize(part)) {
      metadata.size = part;
    } else if (isYear(part)) {
      // Year detection (4-digit number) - very specific
      metadata.year = part;
    } else if (isLanguage(part)) {
      // Language detection - specific list
      metadata.language = part;
    } else if (isContentType(part)) {
      // Content type detection - specific list
      metadata.contentType = part;
    } else if (isFileExtension(part)) {
      // File extension detection - needs to be after content type
      metadata.filetype = part;
    } else if (!metadata.source) {
      // Source detection - fallback
      metadata.source = source || part;
    }
  });

  // Set the source if found via known sources
  if (source) {
    metadata.source = source;
  }

  return metadata;
};

/**
 * Checks if a string represents a language
 * @param {String} str - String to check
 * @return {Boolean}
 */
const isLanguage = (str) => {
  const languages = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
    'Russian', 'Arabic', 'Portuguese', 'Italian', 'Dutch', 'Polish',
    'Korean', 'Turkish', 'Swedish', 'Norwegian', 'Finnish', 'Danish',
    'Greek', 'Hebrew', 'Hindi', 'Thai', 'Vietnamese', 'Indonesian',
    'Malay', 'Filipino', 'Romanian', 'Czech', 'Hungarian',
    'Bulgarian', 'Croatian', 'Serbian', 'Slovak', 'Ukrainian',
    'Lithuanian', 'Latvian', 'Estonian', 'Slovenian', 'Icelandic',
    'Irish', 'Scottish', 'Welsh',
  ];
  return languages.includes(str);
};

/**
 * Checks if a string represents a file extension
 * @param {String} str - String to check
 * @return {Boolean}
 */
const isFileExtension = (str) => {
  const commonExtensions = [
    'PDF', 'EPUB', 'MOBI', 'AZW', 'AZW3', 'DJVU', 'FB2', 'LIT', 'ODT',
    'RTF', 'TXT', 'DOC', 'DOCX', 'HTM', 'HTML', 'CHM', 'CBR',
    'CBZ', 'CB7', 'CBT', 'CBA', 'ZIP', 'RAR', '7Z', 'TAR', 'GZ',
    'MP3', 'FLAC', 'AAC', 'OGG', 'WAV', 'M4A', 'MP4', 'AVI',
    'MKV', 'MOV', 'WMV', 'FLV', 'WEBM',
  ];
  return commonExtensions.includes(str.toUpperCase()) &&
    (str.length >= 2 && str.length <= 10);
};

/**
 * Checks if a string represents a file size
 * @param {String} str - String to check
 * @return {Boolean}
 */
const isSize = (str) => {
  return /\d+[KMGT]?B/i.test(str) || /\d+\.\d+[KMGT]?B/i.test(str);
};

/**
 * Checks if a string represents a year
 * @param {String} str - String to check
 * @return {Boolean}
 */
const isYear = (str) => {
  return /^\d{4}$/.test(str) &&
    parseInt(str) >= 1900 &&
    parseInt(str) <= new Date().getFullYear() + 1;
};

/**
 * Checks if a string represents a content type
 * @param {String} str - String to check
 * @return {Boolean}
 */
const isContentType = (str) => {
  const contentTypes = [
    'book', 'article', 'journal', 'magazine', 'newspaper', 'thesis',
    'report', 'manual', 'guide', 'tutorial', 'paper', 'document',
    'ebook', 'audiobook', 'video', 'audio',
  ];
  return contentTypes.includes(str.toLowerCase());
};

const searchHelper = {
  /**
   * It takes in a bunch of parameters and returns a URL object with those parameters set
   * @param {String} query - The search query.
   * @param {String} lang - The language of search results.
   * @param {String} content - The type of content to search for. Can be one of:
   * @param {String} ext - The file extension to search for.
   * @param {String} sort - The sort order of results.
   * @return {URL} A URL object with search parameters set.
   */
  buildSearchUrl: (query, lang, content, ext, sort) => {
    const url = new URL(BASE_URI + '/search');

    // Only include non-empty parameters in URL
    if (query) url.searchParams.set('q', query);
    if (lang) url.searchParams.set('lang', lang);
    if (content) url.searchParams.set('content', content);
    if (ext) url.searchParams.set('ext', ext);
    if (sort) url.searchParams.set('sort', sort);

    logger.debug('Search URL built', {
      query,
      lang,
      content,
      ext,
      sort,
      finalUrl: url.toString(),
    });

    return url;
  },
  /**
   * > The function takes in a response from a search request, removes comments from HTML data,
   * loads HTML into Cheerio, and then returns an array of objects containing required
   * data from search results.
   * @param {Object} searchResponseHtml - The response from the search request.
   * @return {Object[]} An array of objects.
   */
  collectContents: (searchResponseHtml) => {
    // Validate HTML response
    if (typeof searchResponseHtml !== 'string') {
      throw new Error('Invalid HTML response: Non-string response received');
    }

    if (!searchResponseHtml || searchResponseHtml.trim().length === 0) {
      throw new Error('Invalid HTML response: Empty HTML content received');
    }

    // Remove comment identifiers. Used for client-side pagination by website.
    const htmlData = searchResponseHtml.replace(/(<!--|-->)/g, '');
    const $ = cheerio.load(htmlData);
    const collection = [];

    // Find all search results using the specified selectors (with contains for CSS class matching)
    const $titleLinks = $('a[class*="line-clamp-[3]"][class*="overflow-hidden"]' +
      '[class*="break-words"]');
    const $metadataElements = $('div[class*="text-gray-800"]' +
      '[class*="dark:text-slate-400"][class*="font-semibold"]');
    const $coverContainers = $('div[id^="list_cover_aarecord_id__md5:"]');
    const $authorLinks = $('a:has(span[class*="mdi--user-edit"])');
    // const $md5Links = $('a:has(span[class*="mdi--user-edit"])'); // update to parse md5 string after /md5/ from element "<a href="/md5/d712733956c783a2999b463ce40f45be" class="line-clamp-[3] overflow-hidden break-words js-vim-focus custom-a text-[#2563eb] inline-block outline-offset-[-2px] outline-2 rounded-[3px] focus:outline font-semibold text-lg leading-[1.2] hover:opacity-80 mt-1">Red Rising (The Red Rising Trilogy, Book 1)</a>"

    $titleLinks.each((index, element) => {
      const $element = $(element);
      const metadataElement = $metadataElements.eq(index);
      
      // Extract coverUrl
      const coverUrl = $coverContainers.eq(index).find('img').attr('src');

      // Extract title and MD5 from link element
      const title = $element.text().trim();
      const href = $element.attr('href');
      const md5 = href ? href.replace(MD5, '') : "";

      // Extract author from author link (identified by user-edit icon)
      const author = $authorLinks.eq(index).text().trim();

      // Extract metadata from metadata element
      const metadataText = metadataElement.text().trim();
      const metadata = parseMetadata(metadataText);

      collection.push({
        coverUrl,
        title,
        author,
        md5,
        ...metadata,
      });
    });

    return collection;
  },
  /**
   * It takes in a bunch of parameters and returns a URL object with those parameters set
   * @param {String} md5Path - The content md5 or prefixed md5 to be fetched.
   * @return {URL} A URL object with the formed url.
   */
  buildFetchUrl: (md5Path) => {
    let path = md5Path;
 
    // (ref. https://annas-archive.li/datasets#files). This might change in future!!!
    if (!path.startsWith(MD5)) path = MD5 + path;

    return new URL(BASE_URI + path);
  },

  /**
   * It takes in response from fetch request, loads HTML into Cheerio,
   * and then returns an object containing the required data from the fetch result.
   * @param {Object} fetchResponseHtml - The content md5 or prefixed md5 to be fetched.
   * @return {Object} A URL object with the formed url.
   */
  getContent: (fetchResponseHtml) => {
    // Validate fetch response
    if (typeof fetchResponseHtml !== 'string') {
      throw new Error('Invalid fetch response: Non-string response received');
    }

    if (!fetchResponseHtml || fetchResponseHtml.trim().length === 0) {
      throw new Error('Invalid fetch response: Empty HTML content received');
    }

    const $ = cheerio.load(fetchResponseHtml);
    return fetchContent($('main'));
  },
};

module.exports = searchHelper;