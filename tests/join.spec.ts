import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { createApp } from '../server/app';
import type { ApproveJoin, JoinRequest } from '../server/routes/join';
import type { JoinRequestResponse, JoinStatusResponse } from '../shared/api';
import { uploadsDir } from './helpers';

interface TestServer {
  url: string;
  close: () => void;
}

/** Starts the app in this process with `approve` deciding join requests. */
async function startServer(token: string | undefined, approve: ApproveJoin): Promise<TestServer> {
  // Not the test server's folder: the app clears its temp folder on start.
  const uploadDir = path.join(uploadsDir, '..', 'e2e-join-uploads');
  const app = createApp({ port: 0, uploadDir, client: { embedded: {} }, token }, approve);
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve): void => {
    const listening = app.listen(0, '127.0.0.1', (): void => resolve(listening));
  });
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, close: (): void => void server.close() };
}

/** A join approval the test decides by hand. */
function manualApproval(): {
  approve: ApproveJoin;
  calls: { request: JoinRequest; signal: AbortSignal; decide: (allowed: boolean) => void }[];
} {
  const calls: { request: JoinRequest; signal: AbortSignal; decide: (allowed: boolean) => void }[] =
    [];
  const approve: ApproveJoin = (request: JoinRequest, signal: AbortSignal): Promise<boolean> =>
    new Promise((decide: (allowed: boolean) => void): void => {
      calls.push({ request, signal, decide });
    });
  return { approve, calls };
}

async function requestJoin(
  request: APIRequestContext,
  url: string,
  deviceName: string,
): Promise<string> {
  const response = await request.post(`${url}/api/join`, { data: { deviceName } });
  expect(response.status()).toBe(202);
  return ((await response.json()) as JoinRequestResponse).requestId;
}

async function joinStatus(
  request: APIRequestContext,
  url: string,
  id: string,
): Promise<JoinStatusResponse> {
  const response = await request.get(`${url}/api/join/${id}`);
  expect(response.status()).toBe(200);
  return (await response.json()) as JoinStatusResponse;
}

test.describe('Join requests', () => {
  let server: TestServer | undefined;
  test.afterEach((): void => server?.close());

  test('an approved request gets the access token, which opens the API', async ({ request }) => {
    const { approve, calls } = manualApproval();
    server = await startServer('secret-token', approve);
    const id = await requestJoin(request, server.url, '  Pixel 9  ');

    expect(await joinStatus(request, server.url, id)).toEqual({ status: 'pending' });
    expect(calls.map((call) => call.request)).toEqual([{ deviceName: 'Pixel 9', ip: '127.0.0.1' }]);
    expect((await request.get(`${server.url}/api/files`)).status()).toBe(401);

    calls[0]?.decide(true);
    await expect
      .poll(() => joinStatus(request, server?.url ?? '', id))
      .toEqual({ status: 'approved', token: 'secret-token' });
    const files = await request.get(`${server.url}/api/files`, {
      headers: { 'x-qrup-token': 'secret-token' },
    });
    expect(files.status()).toBe(200);
  });

  test('a denied request gets no token', async ({ request }) => {
    const { approve, calls } = manualApproval();
    server = await startServer('secret-token', approve);
    const id = await requestJoin(request, server.url, 'Pixel 9');

    calls[0]?.decide(false);
    await expect
      .poll(() => joinStatus(request, server?.url ?? '', id))
      .toEqual({ status: 'denied' });
  });

  test('a new request from the same address expires the pending one', async ({ request }) => {
    const { approve, calls } = manualApproval();
    server = await startServer('secret-token', approve);
    const first = await requestJoin(request, server.url, 'Pixel 9');
    const second = await requestJoin(request, server.url, 'Pixel 9 again');

    expect(await joinStatus(request, server.url, first)).toEqual({ status: 'expired' });
    expect(calls[0]?.signal.aborted).toBe(true);
    // Allowing the replaced request changes nothing.
    calls[0]?.decide(true);
    calls[1]?.decide(true);
    await expect
      .poll(() => joinStatus(request, server?.url ?? '', second))
      .toEqual({ status: 'approved', token: 'secret-token' });
    expect(await joinStatus(request, server.url, first)).toEqual({ status: 'expired' });
  });

  test('open mode approves at once without a token', async ({ request }) => {
    const { approve, calls } = manualApproval();
    server = await startServer(undefined, approve);
    const id = await requestJoin(request, server.url, 'Pixel 9');

    expect(await joinStatus(request, server.url, id)).toEqual({ status: 'approved' });
    expect(calls).toEqual([]);
  });

  test('rejects invalid device names and unknown request IDs', async ({ request }) => {
    server = await startServer('secret-token', manualApproval().approve);
    for (const data of [
      {},
      { deviceName: '   ' },
      { deviceName: 'x'.repeat(65) },
      { deviceName: 'a\x1b[2Jb' },
    ]) {
      const response = await request.post(`${server.url}/api/join`, { data });
      expect(response.status(), JSON.stringify(data)).toBe(400);
      expect(await response.json()).toHaveProperty('error');
    }
    await requestJoin(request, server.url, ` ${'x'.repeat(64)} `);

    const unknown = await request.get(`${server.url}/api/join/no-such-request`);
    expect(unknown.status()).toBe(404);
  });

  test('limits join requests per address', async ({ request }) => {
    server = await startServer('secret-token', manualApproval().approve);
    for (let attempt = 0; attempt < 5; attempt++) {
      await requestJoin(request, server.url, `Phone ${attempt}`);
    }
    const limited = await request.post(`${server.url}/api/join`, {
      data: { deviceName: 'Phone 5' },
    });
    expect(limited.status()).toBe(429);
    expect(await limited.json()).toHaveProperty('error');
  });

  test('qrup denies join requests without an interactive terminal', async ({ request }) => {
    // The test server runs qrup itself, whose stdin is not a terminal.
    const id = await requestJoin(request, 'http://localhost:3100', 'Pixel 9');
    await expect
      .poll(() => joinStatus(request, 'http://localhost:3100', id))
      .toEqual({ status: 'denied' });
  });
});
