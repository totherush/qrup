import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** The folder the test server saves uploads to (`uploads` in the repo root). */
export const uploadsDir: string = path.join(here, '..', 'uploads');

export const fixturePath: string = path.join(here, 'fixtures', 'test-file-3mb.bin');

/** Removes everything in the uploads folder except the server's temp folder. */
export function emptyUploads(): void {
  fs.mkdirSync(uploadsDir, { recursive: true });
  for (const entry of fs.readdirSync(uploadsDir)) {
    if (entry === '.qrup-tmp') continue;
    fs.rmSync(path.join(uploadsDir, entry), { recursive: true, force: true });
  }
}
