'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const fixturesDir = path.join(__dirname, 'fixtures');

const readFixture = (name) =>
  fs.readFileSync(path.join(fixturesDir, name), 'utf-8');

test.describe('Search page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ path: 'web/public/css/style.css' });
  });

  test('search form renders correctly', async ({ page }) => {
    await page.goto('/search');

    await expect(page.locator('h1')).toHaveText('Search Anna\'s Archive');
    await expect(page.locator('#query')).toBeVisible();
    await expect(page.locator('#lang')).toBeVisible();
    await expect(page.locator('#content')).toBeVisible();
    await expect(page.locator('#ext')).toBeVisible();
    await expect(page.locator('#sort')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('search results table populates cover, title, author, md5', async ({ page }) => {
    const resultsHtml = readFixture('search-results.html');

    await page.route('**/search', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: resultsHtml,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/search');
    await page.fill('#query', 'Red Rising');
    await page.click('button[type="submit"]');

    await expect(page.locator('.results-table')).toBeVisible();

    // Verify table headers
    const headers = page.locator('.results-table thead th');
    await expect(headers.nth(1)).toHaveText('Cover');
    await expect(headers.nth(2)).toHaveText('Title');
    await expect(headers.nth(3)).toHaveText('Author');
    await expect(headers.nth(4)).toHaveText('MD5');

    // Verify row count
    const rows = page.locator('.results-table tbody tr');
    await expect(rows).toHaveCount(2);

    // First row — has cover image
    const row1 = rows.nth(0);
    await expect(row1.locator('.col-cover img.cover-thumb')).toBeVisible();
    await expect(row1.locator('.col-cover img.cover-thumb')).toHaveAttribute(
      'src',
      'https://s3proxy.cdn-zlib.sk//covers299/collections/userbooks/e978e081b8282dcabf8a88d8c60f8c1b19df61f521d9b8d6893ccee5effd2325.jpghttps://s3proxy.cdn-zlib.someimg.webp',
    );
    await expect(row1.locator('.col-title')).toHaveText('Red Rising');
    await expect(row1.locator('.col-authors')).toHaveText('Pierce Brown');
    await expect(row1.locator('.md5-hash')).toHaveText('abc123def456');

    // Second row — no cover
    const row2 = rows.nth(1);
    await expect(row2.locator('.no-cover')).toBeVisible();
    await expect(row2.locator('.col-title')).toHaveText('Golden Son');
    await expect(row2.locator('.col-authors')).toHaveText('Pierce Brown');
    await expect(row2.locator('.md5-hash')).toHaveText('789ghi012jkl');
  });

  test('empty results show "no results" message', async ({ page }) => {
    const noResultsHtml = readFixture('search-no-results.html');

    await page.route('**/search', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: noResultsHtml,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/search');
    await page.fill('#query', 'nonexistent book xyz');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-info')).toBeVisible();
    await expect(page.locator('.alert-info')).toContainText('No results found');
  });

  test('search error shows error message', async ({ page }) => {
    const errorHtml = readFixture('search-error.html');

    await page.route('**/search', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: errorHtml,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/search');
    await page.fill('#query', 'error test');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toBeVisible();
  });

  test('query value is retained after search', async ({ page }) => {
    const resultsHtml = readFixture('search-results.html');

    await page.route('**/search', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: resultsHtml,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/search');
    await page.fill('#query', 'test query');
    await page.click('button[type="submit"]');

    await expect(page.locator('#query')).toHaveValue('test query');
  });
});
