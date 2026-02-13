'use strict';

const path = require('path');
const express = require('express');
const fs = require('fs');
const logger = require('./logger');

// Load .env from src/config/.env before importing the library
require('dotenv').config({
  path: path.join(__dirname, '..', 'src', 'config', '.env'),
});

const ArchiveOfAnna = require('../index');
const store = require('../src/store');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Settings persistence (simple JSON file next to server.js)
// ---------------------------------------------------------------------------
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

const DEFAULT_SETTINGS = {
  downloadPath: process.env.DOWNLOAD_PATH || './downloads/',
  preferredSource: 'ipfs',
};

/**
 * Read settings from disk, falling back to defaults.
 * @return {Object} The current settings object.
 */
const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (_) {/* fall through */}
  return { ...DEFAULT_SETTINGS };
};

/**
 * Persist settings to disk.
 * @param {Object} settings - The settings object to save.
 */
const saveSettings = (settings) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
};

// In-memory settings (loaded once at start, updated on POST /settings)
const settings = loadSettings();

// ---------------------------------------------------------------------------
// Recent searches persistence
// ---------------------------------------------------------------------------
const { createRecentSearchesManager } = require('./recent-searches');
const RECENT_SEARCHES_FILE = path.join(__dirname, 'recent-searches.json');
const recentSearchesMgr = createRecentSearchesManager(RECENT_SEARCHES_FILE);
let recentSearches = recentSearchesMgr.load();

// ---------------------------------------------------------------------------
// Express configuration
// ---------------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Access logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.access('HTTP request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
});

// Make settings + helpers available to all templates
app.use((req, res, next) => {
  res.locals.settings = settings;
  res.locals.secretKeyConfigured = !!process.env.SECRET_KEY;
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Home -> redirect to search
app.get('/', (req, res) => res.redirect('/search'));

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
app.get('/search', async (req, res) => {
  const { query, lang, content, ext, sort } = req.query;

  // If query params present (from recent search chip), run the search
  if (query && query.trim()) {
    try {
      const results = await ArchiveOfAnna.searchBooks(
        query.trim(), lang || '', content || '', ext || '', sort || '',
      );
      logger.info('Search executed', { query: query.trim(), resultCount: results ? results.length : 0 });
      return res.render('search', {
        results,
        query: query.trim(),
        lang: lang || '', content: content || '', ext: ext || '', sort: sort || '',
        recentSearches,
        error: null,
      });
    } catch (err) {
      return res.render('search', {
        results: null,
        query: query.trim(),
        lang: lang || '', content: content || '', ext: ext || '', sort: sort || '',
        recentSearches,
        error: `Search failed: ${err.message}`,
      });
    }
  }

  res.render('search', {
    results: null,
    query: '',
    lang: '',
    content: '',
    ext: '',
    sort: '',
    recentSearches,
    error: null,
  });
});

app.post('/search', async (req, res) => {
  const { query, lang, content, ext, sort } = req.body;

  if (!query || !query.trim()) {
    return res.render('search', {
      results: null,
      query: '',
      lang: '',
      content: '',
      ext: '',
      sort: '',
      recentSearches,
      error: 'Please enter a search term.',
    });
  }

  try {
    const results = await ArchiveOfAnna.searchBooks(
      query.trim(),
      lang || '',
      content || '',
      ext || '',
      sort || '',
    );

    // Track recent search
    recentSearches = recentSearchesMgr.add({
      query: query.trim(),
      lang: lang || '',
      content: content || '',
      ext: ext || '',
      sort: sort || '',
    });
    logger.info('Search executed', { query: query.trim(), resultCount: results ? results.length : 0 });

    res.render('search', {
      results,
      query: query.trim(),
      lang: lang || '',
      content: content || '',
      ext: ext || '',
      sort: sort || '',
      recentSearches,
      error: null,
    });
  } catch (err) {
    logger.error('Search failed', { query: query.trim(), error: err.message });
    res.render('search', {
      results: null,
      query: query.trim(),
      lang: lang || '',
      content: content || '',
      ext: ext || '',
      sort: sort || '',
      recentSearches,
      error: `Search failed: ${err.message}`,
    });
  }
});

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------
app.post('/download', async (req, res) => {
  const { md5, title } = req.body;

  if (!md5) {
    return res.redirect('/search');
  }

  const downloadPath = path.resolve(settings.downloadPath);
  const preferredSource = settings.preferredSource || 'ipfs';

  try {
    await ArchiveOfAnna.downloadByMd5(
      md5,
      undefined, // let the library decide the filename
      downloadPath,
      preferredSource,
    );

    res.render('download-status', {
      success: true,
      md5,
      title: title || md5,
      downloadPath,
      error: null,
    });
  } catch (err) {
    res.render('download-status', {
      success: false,
      md5,
      title: title || md5,
      downloadPath,
      error: err.message,
    });
  }
});

// JSON endpoint for download progress polling
app.get('/download/status', (req, res) => {
  res.json(store.downloadProgress);
});

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------
const { formatFileSize } = require('./format-utils');

app.get('/downloads', (req, res) => {
  const downloadPath = path.resolve(settings.downloadPath);
  let files = [];

  try {
    if (fs.existsSync(downloadPath)) {
      const entries = fs.readdirSync(downloadPath);
      files = entries.map((name) => {
        try {
          const stat = fs.statSync(path.join(downloadPath, name));
          if (!stat.isFile()) return null;
          return {
            name,
            size: formatFileSize(stat.size),
            modified: stat.mtime.toISOString().split('T')[0],
          };
        } catch (_) {
          return null;
        }
      }).filter(Boolean);
    }
  } catch (err) {
    logger.error('Failed to read downloads directory', { path: downloadPath, error: err.message });
  }

  res.render('downloads', {
    files,
    downloadPath,
    activePage: 'downloads',
  });
});

app.get('/downloads/file/:filename', (req, res) => {
  const filename = req.params.filename;

  // Path traversal protection
  if (filename.includes('..') || path.isAbsolute(filename)) {
    return res.status(400).send('Invalid filename.');
  }

  const downloadPath = path.resolve(settings.downloadPath);
  const filePath = path.join(downloadPath, filename);

  // Verify the resolved path is still within the download directory
  if (!filePath.startsWith(downloadPath)) {
    return res.status(400).send('Invalid filename.');
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found.');
  }

  res.download(filePath);
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
app.get('/settings', (req, res) => {
  res.render('settings', {
    saved: false,
    error: null,
  });
});

app.post('/settings', (req, res) => {
  const { downloadPath, preferredSource } = req.body;

  try {
    if (downloadPath && downloadPath.trim()) {
      settings.downloadPath = downloadPath.trim();
    }
    if (preferredSource) {
      settings.preferredSource = preferredSource;
    }

    saveSettings(settings);

    res.render('settings', {
      saved: true,
      error: null,
    });
  } catch (err) {
    res.render('settings', {
      saved: false,
      error: `Failed to save settings: ${err.message}`,
    });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  logger.info('Server started', {
    url: `http://localhost:${PORT}`,
    secretKeyConfigured: !!process.env.SECRET_KEY,
    downloadPath: path.resolve(settings.downloadPath),
  });
});
