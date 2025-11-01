import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe.configure({ mode: 'serial' });

test.describe('File Upload E2E', () => {
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

  test('should upload a 3MB file successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Upload Files')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);

    await expect(page.getByText('test-file-3mb.bin')).toBeVisible();
    await expect(page.getByText('3 MB')).toBeVisible();

    await page.getByRole('button', { name: 'Upload files' }).click();

    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });

    const progressBar = page.locator('.bg-green-500');
    await expect(progressBar).toBeVisible();
  });

  test('should show error when clicking upload without selecting files', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Upload Files')).toBeVisible();

    const uploadButton = page.getByRole('button', { name: 'Upload files' });
    await expect(uploadButton).not.toBeVisible();
  });

  test('should allow removing files before upload', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);
    await expect(page.getByText('test-file-3mb.bin')).toBeVisible();

    await page.locator('button[aria-label="Remove file"]').click();

    await expect(page.getByText('test-file-3mb.bin')).not.toBeVisible();
  });

  test('should show error when uploading duplicate file', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);
    await page.getByRole('button', { name: 'Upload files' }).click();
    await expect(page.getByText('Upload Successful').first()).toBeVisible({ timeout: 10000 });

    await fileInput.setInputFiles(filePath);
    await page.getByRole('button', { name: 'Upload files' }).click();

    await expect(page.getByText("File 'test-file-3mb.bin' already exists")).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display uploaded file in file browser after upload', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Upload Files')).toBeVisible();
    await expect(page.getByText('File Browser')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles(filePath);

    const uploadSection = page.locator('.bg-white').filter({ hasText: 'Upload Files' });
    await expect(uploadSection.getByText('test-file-3mb.bin')).toBeVisible();

    await page.getByRole('button', { name: 'Upload files' }).click();

    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 });

    const fileBrowserSection = page.locator('.bg-white').filter({ hasText: 'File Browser' });
    await expect(fileBrowserSection.getByText(/test-file-3mb\.bin/).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
