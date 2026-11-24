import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { type QrupProcess, startQrup, token } from './helpers';

let qrup: QrupProcess | undefined;
test.afterEach((): void => void qrup?.child.kill());

/** The JSON lines qrup printed so far. */
function jsonLines(process: QrupProcess): Record<string, unknown>[] {
  return process
    .stdout()
    .split('\n')
    .filter((line: string): boolean => line !== '')
    .map((line: string): Record<string, unknown> => JSON.parse(line));
}

test('--any-network starts qrup with a warning in the banner', async ({ request }) => {
  const port = 3101;
  qrup = startQrup(['--any-network', '-p', String(port)], 'tmp/e2e-any-network-uploads');

  await expect
    .poll(() => qrup?.stdout(), { timeout: 15_000 })
    .toContain(
      '⚠ Any network: devices outside the local network, such as over a VPN, can connect.',
    );
  const files = await request.get(`http://localhost:${port}/api/files`, {
    headers: { 'x-qrup-token': token },
  });
  expect(files.status()).toBe(200);
});

test('--json --exit-after-upload prints JSON lines and exits with the files of one batch', async ({
  request,
}) => {
  const port = 3102;
  const uploadDir = path.resolve('tmp/e2e-agent-uploads');
  fs.rmSync(uploadDir, { recursive: true, force: true });
  // The 3-second timeout passes before the upload batch settles; the upload must hold it off.
  qrup = startQrup(
    ['--json', '--exit-after-upload', '--timeout', '0.05', '-p', String(port)],
    uploadDir,
  );
  const current = qrup;

  // Every stdout line is JSON; the first one says where qrup listens.
  await expect.poll(() => jsonLines(current).length, { timeout: 15_000 }).toBeGreaterThan(0);
  const [listening] = jsonLines(current);
  expect(listening).toMatchObject({
    event: 'listening',
    port,
    localUrl: `http://localhost:${port}/?t=${token}`,
    token,
    uploadDir,
    open: false,
    anyNetwork: false,
  });

  // Two uploads one after another, as the client sends a picked batch, count as one batch.
  const upload = (name: string): Promise<unknown> =>
    request.post(`http://localhost:${port}/api/upload`, {
      headers: { 'x-qrup-token': token },
      multipart: { files: { name, mimeType: 'text/plain', buffer: Buffer.from(name) } },
    });
  await upload('a.txt');
  await upload('b.txt');

  expect(await current.exited).toBe(0);
  const lines = jsonLines(current);
  expect(lines.filter((line) => line.event === 'activity')).toMatchObject([
    { action: 'UPLOAD', subject: 'a.txt' },
    { action: 'UPLOAD', subject: 'b.txt' },
  ]);
  expect(lines.at(-1)).toEqual({
    event: 'exit',
    reason: 'uploaded',
    files: [path.join(uploadDir, 'a.txt'), path.join(uploadDir, 'b.txt')],
  });
  expect(fs.readFileSync(path.join(uploadDir, 'b.txt'), 'utf8')).toBe('b.txt');
});

test('--timeout exits with code 2 when no file arrives', async () => {
  qrup = startQrup(
    ['--json', '--exit-after-upload', '--timeout', '0.02', '-p', '3103'],
    'tmp/e2e-agent-uploads',
  );
  const current = qrup;
  expect(await current.exited).toBe(2);
  expect(jsonLines(current).at(-1)).toEqual({ event: 'exit', reason: 'timeout', files: [] });
});
