import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
test('public and editor meet automated accessibility checks', async ({ page }) => {
  for (const route of ['/resume', '/edit']) {
    await page.goto(route);
    await page.getByRole('link', { name: 'Folio home' }).focus();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  }
});
test('uploads validate signatures and extract real PDFs; stale saves are rejected', async ({
  page,
  request,
}) => {
  const origin = 'http://127.0.0.1:3100';
  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'Alex Morgan', exact: true })).toBeVisible();
  const pdf = await page.pdf({ format: 'Letter' });
  const upload = await request.post('/api/upload', {
    headers: { origin },
    multipart: { file: { name: 'resume.pdf', mimeType: 'application/pdf', buffer: pdf } },
  });
  expect(upload.status()).toBe(200);
  const { source } = await upload.json();
  expect(source.status).toBe('ready');
  expect(source.text).toContain('Alex Morgan');
  const downloaded = await request.get(`/api/sources/${source.id}`);
  expect(downloaded.ok()).toBe(true);
  expect((await downloaded.body()).length).toBe(pdf.length);
  const image = await page.screenshot();
  const imageResponse = await request.post('/api/upload', {
    headers: { origin },
    multipart: { file: { name: 'certificate.png', mimeType: 'image/png', buffer: image } },
  });
  expect(imageResponse.ok()).toBe(true);
  expect((await imageResponse.json()).source.status).toBe('needs-vision');
  const invalid = await request.post('/api/upload', {
    headers: { origin },
    multipart: {
      file: {
        name: 'fake.png',
        mimeType: 'image/png',
        buffer: Buffer.from('<svg onload="alert(1)"/>'),
      },
    },
  });
  expect(invalid.status()).toBe(400);
  const truncatedImage = await request.post('/api/upload', {
    headers: { origin },
    multipart: {
      file: {
        name: 'broken.png',
        mimeType: 'image/png',
        buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
      },
    },
  });
  expect(truncatedImage.status()).toBe(400);
  const badPdf = await request.post('/api/upload', {
    headers: { origin },
    multipart: {
      file: {
        name: 'invalid.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.7 broken'),
      },
    },
  });
  expect(badPdf.ok()).toBe(true);
  expect((await badPdf.json()).source.status).toBe('extraction-failed');
  const { resume } = await (await request.get('/api/resume')).json();
  const saved = await request.post('/api/resume', { headers: { origin }, data: { resume } });
  expect(saved.ok()).toBe(true);
  const conflict = await request.post('/api/resume', { headers: { origin }, data: { resume } });
  expect(conflict.status()).toBe(409);
  await fs.mkdir('test-results', { recursive: true });
});
