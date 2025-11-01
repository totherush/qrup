import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe.configure({ mode: 'serial' });

test.describe('Upload States and Icons', () => {
  test.beforeEach(async () => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
          } catch {
            // File may have already been deleted
          }
        }
      }
    }
  });

  test.afterEach(async () => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
          } catch {
            // File may have already been deleted
          }
        }
      }
    }
  });

  test('should show X icon for pending state', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);

    await expect(page.getByText('test-file-3mb.bin')).toBeVisible();

    const removeButton = page.locator('button[aria-label="Remove file"]');
    await expect(removeButton).toBeVisible();

    const xIcon = removeButton.locator('svg path[d*="M6 18L18 6M6 6l12 12"]');
    await expect(xIcon).toBeVisible();
  });

  test('should remove file from pending state when X icon is clicked', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);
    
    const uploadSection = page.locator('.bg-white').filter({ hasText: 'Upload Files' });
    await expect(uploadSection.getByText('test-file-3mb.bin')).toBeVisible();

    await page.locator('button[aria-label="Remove file"]').click();

    await expect(uploadSection.getByText('test-file-3mb.bin')).not.toBeVisible();
  });

  test('should show stop icon during upload', async ({ page }) => {
    await page.goto('/');

    await page.route('**/api/upload', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);
    await page.getByRole('button', { name: 'Upload files' }).click();

    const stopButton = page.locator('button[aria-label="Stop upload"]');
    await expect(stopButton).toBeVisible({ timeout: 1000 });

    const stopIcon = stopButton.locator('svg rect');
    await expect(stopIcon).toBeVisible();
  });

  test('should stop upload when stop icon is clicked', async ({ page }) => {
    await page.goto('/');

    await page.route('**/api/upload', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, files: ['test-file.bin'] }),
      });
    });

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);
    await page.getByRole('button', { name: 'Upload files' }).click();

    const stopButton = page.locator('button[aria-label="Stop upload"]');
    await expect(stopButton).toBeVisible({ timeout: 1000 });

    await stopButton.click();

    await expect(page.getByText('Upload cancelled')).toBeVisible({ timeout: 2000 });
  });

  test('should show bin icon after successful upload', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);
    await page.getByRole('button', { name: 'Upload files' }).click();

    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });

    const deleteButton = page.locator('button[aria-label="Delete file"]');
    await expect(deleteButton).toBeVisible();

    const binIcon = deleteButton.locator('svg path[d*="M19 7l-.867 12.142"]');
    await expect(binIcon).toBeVisible();
  });

  test('should show bin icon after failed upload', async ({ page }) => {
    await page.goto('/');

    await page.route('**/api/upload', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Upload failed' }),
      });
    });

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);
    await page.getByRole('button', { name: 'Upload files' }).click();

    await expect(page.getByText('Upload failed')).toBeVisible({ timeout: 5000 });

    const deleteButton = page.locator('button[aria-label="Delete file"]');
    await expect(deleteButton).toBeVisible();

    const binIcon = deleteButton.locator('svg path[d*="M19 7l-.867 12.142"]');
    await expect(binIcon).toBeVisible();
  });

  test('should transition from X to stop to bin icon', async ({ page }) => {
    await page.goto('/');

    await page.route('**/api/upload', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);

    const removeButton = page.locator('button[aria-label="Remove file"]');
    await expect(removeButton).toBeVisible();

    await page.getByRole('button', { name: 'Upload files' }).click();

    const stopButton = page.locator('button[aria-label="Stop upload"]');
    await expect(stopButton).toBeVisible({ timeout: 1000 });

    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });

    const deleteButton = page.locator('button[aria-label="Delete file"]');
    await expect(deleteButton).toBeVisible();
  });
});
