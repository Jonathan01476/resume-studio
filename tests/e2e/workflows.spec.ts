import { test, expect } from '@playwright/test';
test('public document, keyboard details, responsive layout and print', async ({ page }) => {
  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'Alex Morgan', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explore details: Atlas / Research companion' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.screenshot({ path: 'test-results/public-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({ path: 'test-results/public-mobile.png', fullPage: true });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.app-header')).not.toBeVisible();
  await page.pdf({ path: 'test-results/resume-letter.pdf', preferCSSPageSize: true });
});
test('drafts remain private until publication; AI approval and uploads work', async ({
  page,
  request,
}) => {
  await page.goto('/edit');
  await expect(
    page.getByRole('heading', { name: 'Your experience. A clearer story.' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/studio-desktop.png',
    fullPage: true,
    caret: 'initial',
  });
  await page.getByRole('tab', { name: 'Content' }).click();
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Alex Morgan — draft');
  await expect(
    page.getByRole('heading', { name: 'Alex Morgan — draft', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Draft saved.');
  const publicPage = await page.context().newPage();
  await publicPage.goto('/resume');
  await expect(publicPage.getByRole('heading', { name: 'Alex Morgan', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Publish now' }).click();
  await expect(page.getByRole('status')).toContainText('Published.');
  await publicPage.reload();
  await expect(
    publicPage.getByRole('heading', { name: 'Alex Morgan — draft', exact: true }),
  ).toBeVisible();
  await publicPage.close();
  await name.fill('Alex Morgan');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Publish now' }).click();
  await expect(page.getByRole('status')).toContainText('Published.');
  await page.getByRole('tab', { name: 'Assistant' }).click();
  await page.getByRole('button', { name: 'Move certifications above projects' }).click();
  await page.getByRole('button', { name: 'Generate proposal' }).click();
  await expect(page.getByRole('region', { name: 'Review proposed changes' })).toBeVisible();
  await page.getByRole('button', { name: 'Discard proposal' }).click();
  await page.getByRole('button', { name: 'Generate proposal' }).click();
  await page.getByRole('button', { name: 'Approve & save draft' }).click();
  await expect(page.getByRole('status')).toContainText('Proposal saved');
  const approved = (await (await request.get('/api/resume')).json()).resume;
  expect(approved.sectionOrder.indexOf('certifications')).toBeLessThan(
    approved.sectionOrder.indexOf('projects'),
  );
  const live = await page.context().newPage();
  await live.goto('/resume');
  expect(
    await live.locator('.resume-section').evaluateAll((nodes) => nodes.map((n) => n.id)),
  ).toEqual(['experience', 'projects', 'education', 'skills', 'certifications']);
  await live.close();
  await page.locator('input[type=file][accept*="application/pdf"]').setInputFiles({
    name: 'career.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Worked on Python data pipelines.'),
  });
  await expect(page.getByRole('link', { name: 'career.txt' })).toBeVisible();
  const response = await request.post('/api/resume', {
    headers: { origin: 'https://evil.example' },
    data: {},
  });
  expect(response.status()).toBe(403);
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByText('A record of your progress.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Review', exact: true }).first().click();
  await page.getByRole('button', { name: 'Approve & save draft' }).click();
  await expect(page.getByRole('status')).toContainText('Proposal saved');
  const restored = (await (await request.get('/api/resume')).json()).resume;
  expect(restored.sectionOrder).toEqual([
    'experience',
    'projects',
    'education',
    'skills',
    'certifications',
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({ path: 'test-results/studio-mobile.png', fullPage: true });
});
