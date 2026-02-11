'use strict';

const path = require('path');
const express = require('express');
const fs = require('fs');

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
      return {...DEFAULT_SETTINGS, ...JSON.parse(raw)};
    }
  } catch (_) { /* fall through */ }
  return {...DEFAULT_SETTINGS};
};

/**
 * Persist settings to disk.
 * @param {Object} settings - The settings object to save.
 */
const saveSettings = (settings) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
};

// In-memory settings (loaded once at start, updated on POST /settings)
let settings = loadSettings();

// ---------------------------------------------------------------------------
// Express configuration
// ---------------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
app.get('/search', (req, res) => {
  res.render('search', {
    results: null,
    query: '',
    lang: '',
    content: '',
    ext: '',
    sort: '',
    error: null,
  });
});

app.post('/search', async (req, res) => {
  const {query, lang, content, ext, sort} = req.body;

  if (!query || !query.trim()) {
    return res.render('search', {
      results: null,
      query: '',
      lang: '',
      content: '',
      ext: '',
      sort: '',
      error: 'Please enter a search term.',
    });
  }

  try {
    const results = await ArchiveOfAnna.search(
      query.trim(),
      lang || '',
      content || '',
      ext || '',
      sort || '',
    );

    res.render('search', {
      results,
      query: query.trim(),
      lang: lang || '',
      content: content || '',
      ext: ext || '',
      sort: sort || '',
      error: null,
    });
  } catch (err) {
    res.render('search', {
      results: null,
      query: query.trim(),
      lang: lang || '',
      content: content || '',
      ext: ext || '',
      sort: sort || '',
      error: `Search failed: ${err.message}`,
    });
  }
});

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------
app.post('/download', async (req, res) => {
  const {md5, title} = req.body;

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
// Settings
// ---------------------------------------------------------------------------
app.get('/settings', (req, res) => {
  res.render('settings', {
    saved: false,
    error: null,
  });
});

app.post('/settings', (req, res) => {
  const {downloadPath, preferredSource} = req.body;

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
  console.log(`Archive of Anna web service running at http://localhost:${PORT}`);
  console.log(`SECRET_KEY configured: ${!!process.env.SECRET_KEY}`);
  console.log(`Download path: ${path.resolve(settings.downloadPath)}`);
});
