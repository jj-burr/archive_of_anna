const {expect} = require('../helpers/test-setup');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {createRecentSearchesManager} = require('../../web/recent-searches');

describe('Recent Searches', () => {
  let tmpFile;
  let mgr;

  beforeEach(() => {
    tmpFile = path.join(
      os.tmpdir(),
      `recent-searches-test-${Date.now()}.json`,
    );
    mgr = createRecentSearchesManager(tmpFile);
  });

  afterEach(() => {
    try {
      fs.unlinkSync(tmpFile);
    } catch (_) { /* ignore */ }
  });

  it('should return empty array when JSON file missing', () => {
    const result = mgr.load();
    expect(result).to.deep.equal([]);
  });

  it('should load existing entries from JSON', () => {
    fs.writeFileSync(tmpFile, JSON.stringify([
      {query: 'test', lang: '', content: '', ext: '', sort: '', timestamp: 1},
    ]));

    const result = mgr.load();
    expect(result).to.have.length(1);
    expect(result[0].query).to.equal('test');
  });

  it('should add new search entry', () => {
    const result = mgr.add({
      query: 'machine learning',
      lang: 'en',
      content: '',
      ext: 'pdf',
      sort: '',
    });

    expect(result).to.have.length(1);
    expect(result[0].query).to.equal('machine learning');
    expect(result[0]).to.have.property('timestamp');
  });

  it('should deduplicate by query (case-insensitive)', () => {
    mgr.add({query: 'Machine Learning', lang: '', content: '', ext: '', sort: ''});
    const result = mgr.add({query: 'machine learning', lang: 'en', content: '', ext: 'pdf', sort: ''});

    expect(result).to.have.length(1);
    expect(result[0].query).to.equal('machine learning');
    expect(result[0].lang).to.equal('en');
  });

  it('should cap at 10 entries (FIFO)', () => {
    for (let i = 0; i < 12; i++) {
      mgr.add({query: `query ${i}`, lang: '', content: '', ext: '', sort: ''});
    }

    const result = mgr.load();
    expect(result).to.have.length(10);
    // Most recent should be first
    expect(result[0].query).to.equal('query 11');
  });

  it('should save to JSON file', () => {
    mgr.add({query: 'test save', lang: '', content: '', ext: '', sort: ''});

    expect(fs.existsSync(tmpFile)).to.be.true;
    const raw = fs.readFileSync(tmpFile, 'utf-8');
    const data = JSON.parse(raw);
    expect(data).to.have.length(1);
    expect(data[0].query).to.equal('test save');
  });

  it('should handle corrupt JSON gracefully', () => {
    fs.writeFileSync(tmpFile, '{invalid json!!!');

    const result = mgr.load();
    expect(result).to.deep.equal([]);
  });
});
