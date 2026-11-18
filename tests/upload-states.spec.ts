import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { emptyUploads, fixturePath, startUrl, uploadsDir } from './helpers';

const X_ICON = 'svg path[d*="M6 18L18 6M6 6l12 12"]';
const BIN_ICON = 'svg path[d*="M19 7l-.867 12.142"]';

test.describe.configure({ mode: 'serial' });

async function selectAndUpload(page: Page): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.getByRole('button', { name: 'Upload files' }).click();
}

test.describe('Access token', () => {
  test('should explain how to connect when the page is opened without the token', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText('Scan the QR code that qrup shows again')).toBeVisible();
  });
});

test.describe('Upload States and Icons', () => {
  test.beforeEach(emptyUploads);
  test.afterEach(emptyUploads);

  test('should show X icon for pending state', async ({ page }) => {
    await page.goto(startUrl);
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.getByRole('button', { name: 'Remove file' }).locator(X_ICON)).toBeVisible();
  });

  test('should show stop icon during upload and remove the row when stopped', async ({ page }) => {
    await page.route('**/api/upload', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({ status: 200, json: { success: true, files: ['test-file-3mb.bin'] } });
    });
    await page.goto(startUrl);
    await selectAndUpload(page);

    const stopButton = page.getByRole('button', { name: 'Stop upload' });
    await expect(stopButton.locator('svg rect')).toBeVisible({ timeout: 1000 });
    await stopButton.click();
    await expect(page.getByText('test-file-3mb.bin')).not.toBeVisible({ timeout: 2000 });
  });

  test('should show bin icon after successful upload and delete the file', async ({ page }) => {
    await page.goto(startUrl);
    await selectAndUpload(page);
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });

    const deleteButton = page.getByRole('button', { name: 'Delete file' });
    await expect(deleteButton.locator(BIN_ICON)).toBeVisible();
    await deleteButton.click();
    await expect(page.getByText('Upload folder is empty')).toBeVisible();
    expect(fs.existsSync(path.join(uploadsDir, 'test-file-3mb.bin'))).toBe(false);
  });

  test('should keep the existing file when dismissing a failed upload', async ({ page }) => {
    const existing = path.join(uploadsDir, 'test-file-3mb.bin');
    fs.writeFileSync(existing, 'already here');
    await page.route('**/api/upload', (route) =>
      route.fulfill({ status: 500, json: { error: 'Disk full' } }),
    );
    await page.goto(startUrl);
    await selectAndUpload(page);
    await expect(page.getByText('Disk full')).toBeVisible({ timeout: 5000 });

    const removeButton = page.getByRole('button', { name: 'Remove file' });
    await expect(removeButton.locator(X_ICON)).toBeVisible();
    await removeButton.click();
    await expect(page.getByText('Disk full')).not.toBeVisible();
    // Give a wrongly sent DELETE time to reach the server before checking.
    await page.waitForTimeout(500);
    expect(fs.readFileSync(existing, 'utf8')).toBe('already here');
  });

  test('should transition from X to stop to bin icon', async ({ page }) => {
    await page.route('**/api/upload', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });
    await page.goto(startUrl);
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.getByRole('button', { name: 'Remove file' })).toBeVisible();

    await page.getByRole('button', { name: 'Upload files' }).click();
    await expect(page.getByRole('button', { name: 'Stop upload' })).toBeVisible({ timeout: 1000 });
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Delete file' })).toBeVisible();
  });
});
