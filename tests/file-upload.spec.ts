import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('File Upload E2E', () => {
  test.afterEach(async () => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
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

  test('should upload multiple files', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'test-file-3mb.bin');

    await fileInput.setInputFiles([filePath, filePath]);

    const fileItems = page.getByText('test-file-3mb.bin');
    await expect(fileItems.first()).toBeVisible();

    await page.getByRole('button', { name: 'Upload files' }).click();

    await expect(page.getByText('Upload Successful').first()).toBeVisible({ timeout: 10000 });
  });
});
