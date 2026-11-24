import { type ChildProcess, spawn } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createApp } from '../server/app';
import { isLocalNetworkAddress } from '../server/lib/local-network';
import { token, uploadsDir } from './helpers';

const REFUSED = 'qrup only accepts devices on the same network.';

test.describe('isLocalNetworkAddress', () => {
  const local = [
    '127.0.0.1',
    '127.255.255.254',
    '10.0.0.0',
    '10.255.255.255',
    '172.16.0.0',
    '172.31.255.255',
    '192.168.0.0',
    '192.168.255.255',
    '169.254.0.1',
    '169.254.255.255',
    '::1',
    '0:0:0:0:0:0:0:1',
    'fe80::1',
    'fe80::1%en0',
    'febf:ffff::1',
    'fc00::1',
    'fd12:3456:789a::1',
    'FDFF:FFFF::1',
    '::ffff:192.168.1.5',
    '::ffff:127.0.0.1',
    '::FFFF:10.1.2.3',
    '::ffff:c0a8:105', // ::ffff:192.168.1.5 in hex groups
    '0:0:0:0:0:ffff:172.20.0.1',
  ];
  const notLocal = [
    '8.8.8.8',
    '1.1.1.1',
    '9.255.255.255',
    '11.0.0.0',
    '172.15.255.255',
    '172.32.0.0',
    '192.167.255.255',
    '192.169.0.0',
    '169.253.255.255',
    '169.255.0.0',
    '100.64.0.1',
    '100.100.100.100',
    '100.127.255.255',
    '128.0.0.1',
    '0.0.0.0',
    '2001:4860:4860::8888',
    '2a00:1450:4001:82a::200e',
    '::',
    '::2',
    'fec0::1',
    'fe7f::1',
    'fbff::1',
    'fe00::1',
    '::ffff:8.8.8.8',
    '::ffff:100.64.0.1',
    '::ffff:172.32.0.1',
    '64:ff9b::192.168.1.5', // NAT64 of a private address arrives from a public network
    '::192.168.1.5', // deprecated IPv4-compatible form, not mapped
    '',
    'localhost',
    '192.168.1',
    '192.168.1.256',
  ];

  for (const address of local) {
    test(`${address} is local`, () => expect(isLocalNetworkAddress(address)).toBe(true));
  }
  for (const address of notLocal) {
    test(`${JSON.stringify(address)} is not local`, () =>
      expect(isLocalNetworkAddress(address)).toBe(false));
  }
});

test.describe('Requests from outside the local network', () => {
  let close: (() => void) | undefined;
  test.afterEach((): void => close?.());

  /**
   * Starts the app behind a test-only layer that pretends the connection comes from the address
   * in the `x-test-remote` header, since a real connection to this test only comes from loopback.
   */
  async function startServer(anyNetwork: boolean): Promise<string> {
    const uploadDir = path.join(uploadsDir, '..', 'e2e-network-uploads');
    const outer = express();
    outer.use((req: Request, _res: Response, next: NextFunction): void => {
      const remote = req.get('x-test-remote');
      if (remote) Object.defineProperty(req.socket, 'remoteAddress', { value: remote });
      next();
    });
    outer.use(
      createApp(
        { port: 0, uploadDir, client: { embedded: {} }, token: undefined, anyNetwork },
        async (): Promise<boolean> => true,
      ),
    );
    const server = await new Promise<ReturnType<typeof outer.listen>>((resolve): void => {
      const listening = outer.listen(0, '127.0.0.1', (): void => resolve(listening));
    });
    close = (): void => void server.close();
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  test('are refused on the API, join endpoints, and client', async ({ request }) => {
    const url = await startServer(false);
    // New connection per request, so each one gets its own pretended address.
    const from = (remote: string): Record<string, string> => ({
      'x-test-remote': remote,
      connection: 'close',
    });

    for (const remote of ['203.0.113.7', '100.64.1.2', '2001:db8::1', '::ffff:8.8.8.8']) {
      const files = await request.get(`${url}/api/files`, { headers: from(remote) });
      expect(files.status()).toBe(403);
      expect(await files.json()).toEqual({ error: REFUSED });

      const join = await request.post(`${url}/api/join`, {
        headers: from(remote),
        data: { deviceName: 'Pixel 9' },
      });
      expect(join.status()).toBe(403);
      expect(await join.json()).toEqual({ error: REFUSED });

      const page = await request.get(`${url}/`, { headers: from(remote) });
      expect(page.status()).toBe(403);
      expect(await page.text()).toBe(REFUSED);
    }

    // A forwarded header does not make a public connection local.
    const forwarded = await request.get(`${url}/api/files`, {
      headers: { ...from('203.0.113.7'), 'x-forwarded-for': '192.168.1.5' },
    });
    expect(forwarded.status()).toBe(403);

    for (const remote of ['192.168.1.5', '::ffff:10.0.0.2', 'fd00::5', '127.0.0.1']) {
      const files = await request.get(`${url}/api/files`, { headers: from(remote) });
      expect(files.status()).toBe(200);
    }
  });

  test('are served with --any-network', async ({ request }) => {
    const url = await startServer(true);
    const files = await request.get(`${url}/api/files`, {
      headers: { 'x-test-remote': '100.64.1.2', connection: 'close' },
    });
    expect(files.status()).toBe(200);
  });
});

test.describe('--any-network flag', () => {
  let child: ChildProcess | undefined;
  test.afterEach((): void => void child?.kill());

  test('starts qrup with a warning in the banner', async ({ request }) => {
    // The same server the suite runs against: the compiled binary, or the build from `bun run start`.
    const [command = 'bun', ...args] = process.env.QRUP_BINARY
      ? [process.env.QRUP_BINARY]
      : ['bun', 'dist/server.js'];
    const port = 3101;
    child = spawn(command, [...args, '--any-network', '-p', String(port)], {
      env: {
        ...process.env,
        UPLOAD_FOLDER: 'tmp/e2e-any-network-uploads',
        QRUP_TOKEN: token,
        NO_COLOR: '1',
      },
    });
    let output = '';
    child.stdout?.on('data', (chunk: Buffer): void => {
      output += chunk.toString();
    });

    await expect
      .poll(() => output, { timeout: 15_000 })
      .toContain(
        '⚠ Any network: devices outside the local network, such as over a VPN, can connect.',
      );
    const files = await request.get(`http://localhost:${port}/api/files`, {
      headers: { 'x-qrup-token': token },
    });
    expect(files.status()).toBe(200);
  });
});
