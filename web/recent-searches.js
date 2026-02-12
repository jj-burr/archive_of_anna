const fs = require('fs');

const MAX_RECENT_SEARCHES = 10;

const createRecentSearchesManager = (filePath) => {
  const load = () => {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (_) {/* fall through */}
    return [];
  };

  const save = (searches) => {
    fs.writeFileSync(filePath, JSON.stringify(searches, null, 2), 'utf-8');
  };

  const add = (params) => {
    const searches = load();
    // Remove duplicate (case-insensitive match on query)
    const filtered = searches.filter(
      (s) => s.query.toLowerCase() !== params.query.toLowerCase(),
    );
    // Add to front
    filtered.unshift({ ...params, timestamp: Date.now() });
    // Cap at max
    const capped = filtered.slice(0, MAX_RECENT_SEARCHES);
    save(capped);
    return capped;
  };

  return { load, save, add, MAX_RECENT_SEARCHES };
};

module.exports = { createRecentSearchesManager, MAX_RECENT_SEARCHES };
