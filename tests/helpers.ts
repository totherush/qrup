import { type ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * The folder the test server saves uploads to. It is separate from `uploads/`, which may hold
 * real files, because the tests empty it before and after every test.
 */
export const uploadsDir: string = path.join(here, '..', 'tmp', 'e2e-uploads');

/** Fixed access token for the test server (see playwright.config.ts). */
export const token: string = 'e2e-test-token';

/** The app's start page, as opened from the QR code. */
export const startUrl: string = `/?t=${token}`;

export const fixturePath: string = path.join(here, 'fixtures', 'test-file-3mb.bin');

/** Removes everything in the uploads folder except the server's temp folder. */
export function emptyUploads(): void {
  fs.mkdirSync(uploadsDir, { recursive: true });
  for (const entry of fs.readdirSync(uploadsDir)) {
    if (entry === '.qrup-tmp') continue;
    fs.rmSync(path.join(uploadsDir, entry), { recursive: true, force: true });
  }
}

export interface QrupProcess {
  child: ChildProcess;
  /** Everything the process printed on stdout so far. */
  stdout: () => string;
  /** Resolves with the exit code once the process exits. */
  exited: Promise<number | null>;
}

/**
 * Starts qrup as its own process with `args`, the same way the suite's server runs: the
 * compiled binary from `QRUP_BINARY`, or the build that `bun run start` made.
 */
export function startQrup(args: readonly string[], uploadFolder: string): QrupProcess {
  const [command = 'bun', ...base] = process.env.QRUP_BINARY
    ? [process.env.QRUP_BINARY]
    : ['bun', 'dist/server.js'];
  const child = spawn(command, [...base, ...args], {
    env: { ...process.env, UPLOAD_FOLDER: uploadFolder, QRUP_TOKEN: token, NO_COLOR: '1' },
  });
  let stdout = '';
  child.stdout?.on('data', (chunk: Buffer): void => {
    stdout += chunk.toString();
  });
  const exited = new Promise<number | null>((resolve): void => {
    child.once('exit', (code: number | null): void => resolve(code));
  });
  return { child, stdout: (): string => stdout, exited };
}
