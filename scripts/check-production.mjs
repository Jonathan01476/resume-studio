import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const base = process.env.TEST_PRODUCTION_URL ?? 'http://127.0.0.1:3101';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/edit`);
await page.waitForURL(`${base}/login`);
assert.equal(await page.locator('.studio').count(), 0);
await browser.close();
for (const route of ['/api/resume', '/api/ai', '/api/upload']) {
  const response = await fetch(`${base}${route}`, {
    method: 'POST',
    headers: { origin: base, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(response.status, 401, `${route} must be private`);
}
const publicPage = await fetch(`${base}/resume`);
assert.equal(publicPage.status, 200);
console.log(
  'PASS: production editor redirects to login, mutation routes return 401, public page loads.',
);
