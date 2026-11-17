import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { emptyUploads, fixturePath, uploadsDir } from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('File Upload E2E', () => {
  test.beforeEach(emptyUploads);
  test.afterEach(emptyUploads);

  test('should upload a 3MB file successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Upload Files')).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.getByText('test-file-3mb.bin')).toBeVisible();
    await expect(page.getByText('3 MB')).toBeVisible();

    await page.getByRole('button', { name: 'Upload files' }).click();
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.bg-green-500')).toBeVisible();
    expect(fs.statSync(path.join(uploadsDir, 'test-file-3mb.bin')).size).toBe(
      fs.statSync(fixturePath).size,
    );
  });

  test('should hide the upload button until files are selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Upload Files')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload files' })).not.toBeVisible();
  });

  test('should allow removing files before upload', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.getByText('test-file-3mb.bin')).toBeVisible();

    await page.getByRole('button', { name: 'Remove file' }).click();
    await expect(page.getByText('test-file-3mb.bin')).not.toBeVisible();
  });

  test('should save a duplicate upload under a new name', async ({ page }) => {
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(fixturePath);
    await page.getByRole('button', { name: 'Upload files' }).click();
    await expect(page.getByText('Upload Successful').first()).toBeVisible({ timeout: 10000 });

    await fileInput.setInputFiles(fixturePath);
    await page.getByRole('button', { name: 'Upload files' }).click();
    await expect(page.getByText('saved as test-file-3mb (1).bin')).toBeVisible({ timeout: 10000 });
    expect(fs.readdirSync(uploadsDir).sort()).toEqual(
      expect.arrayContaining(['test-file-3mb (1).bin', 'test-file-3mb.bin']),
    );
  });

  test('should upload several files at once', async ({ page }) => {
    await page.goto('/');
    const content = Buffer.alloc(256 * 1024, 1);
    await page.locator('input[type="file"]').setInputFiles(
      ['a.bin', 'b.bin', 'c.bin', 'd.bin'].map((name) => ({
        name,
        mimeType: 'application/octet-stream',
        buffer: content,
      })),
    );
    await page.getByRole('button', { name: 'Upload files' }).click();
    await expect(page.getByText('Upload Successful')).toHaveCount(4, { timeout: 10000 });
    expect(
      fs
        .readdirSync(uploadsDir)
        .filter((name) => name.endsWith('.bin'))
        .sort(),
    ).toEqual(['a.bin', 'b.bin', 'c.bin', 'd.bin']);
  });

  test('should display uploaded file in file browser after upload', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await page.getByRole('button', { name: 'Upload files' }).click();
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });

    const fileBrowser = page.locator('section').filter({ hasText: 'File Browser' });
    await expect(fileBrowser.getByText('test-file-3mb.bin')).toBeVisible({ timeout: 10000 });
  });

  test('should download a selected folder as a ZIP', async ({ page }) => {
    fs.mkdirSync(path.join(uploadsDir, 'photos'));
    fs.writeFileSync(path.join(uploadsDir, 'photos', 'one.txt'), 'one');
    await page.goto('/');

    await page.getByRole('checkbox', { name: 'Select photos' }).check();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download (1)' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('photos.zip');
    const zip = fs.readFileSync(await download.path());
    expect(zip.subarray(0, 2).toString()).toBe('PK');
    expect(zip.includes('photos/one.txt')).toBe(true);
  });
});

test.describe('API', () => {
  test('should refuse paths outside the upload folder', async ({ request }) => {
    for (const files of ['../package.json', '../uploads2/x', '/etc/hosts']) {
      const response = await request.get('/api/download', { params: { files } });
      expect(response.status(), files).toBe(404);
    }
    const response = await request.delete(`/api/upload/${encodeURIComponent('../package.json')}`);
    expect(response.status()).toBe(403);
  });
});
