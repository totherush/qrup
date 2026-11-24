import { randomUUID } from 'node:crypto';
import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import type {
  ErrorResponse,
  JoinRequestBody,
  JoinRequestResponse,
  JoinStatus,
  JoinStatusResponse,
} from '../../shared/api';
import { clientAddress, logEvent } from '../lib/logger';

/** A device that asks to connect. */
export interface JoinRequest {
  deviceName: string;
  ip: string;
}

/**
 * Decides whether a device may connect; resolves `true` to allow it. `signal` aborts when the
 * request expires or a newer one from the same IP replaces it, so a prompt can stop waiting.
 */
export type ApproveJoin = (request: JoinRequest, signal: AbortSignal) => Promise<boolean>;

const EXPIRE_AFTER_MS = 2 * 60_000;
/** How long the outcome of a request stays readable before its ID answers 404. */
const FORGET_AFTER_MS = 60_000;
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_NAME_LENGTH = 64;

interface Entry {
  ip: string;
  status: JoinStatus;
  controller: AbortController;
}

/**
 * `POST /api/join` asks to connect without the QR code: it answers 202 with a request ID and
 * hands the request to `approve`. In open mode (`token` undefined) it is approved at once.
 * Each IP has at most one pending request; a new one expires the previous one.
 *
 * `GET /api/join/:requestId` reports the request's status, and the access token once approved.
 *
 * Both need no access token, so mount this router before the token check.
 */
export function joinRouter(token: string | undefined, approve: ApproveJoin): Router {
  const entries = new Map<string, Entry>();
  const pendingByIp = new Map<string, string>();
  const recentByIp = new Map<string, number[]>();

  /** Counts a request from `ip`; returns false when it is over the rate limit. */
  function withinRateLimit(ip: string): boolean {
    const now = Date.now();
    for (const [address, times] of recentByIp) {
      const recent = times.filter((time: number): boolean => now - time < RATE_WINDOW_MS);
      if (recent.length === 0) recentByIp.delete(address);
      else recentByIp.set(address, recent);
    }
    const recent = recentByIp.get(ip) ?? [];
    if (recent.length >= MAX_REQUESTS_PER_WINDOW) return false;
    recentByIp.set(ip, [...recent, now]);
    return true;
  }

  /** Moves a pending request to its final status; returns false when it was no longer pending. */
  function settle(id: string, status: Exclude<JoinStatus, 'pending'>): boolean {
    const entry = entries.get(id);
    if (entry?.status !== 'pending') return false;
    entry.status = status;
    entry.controller.abort();
    if (pendingByIp.get(entry.ip) === id) pendingByIp.delete(entry.ip);
    setTimeout((): boolean => entries.delete(id), FORGET_AFTER_MS).unref();
    return true;
  }

  const router = Router();

  router.post(
    '/join',
    express.json({ limit: '4kb' }),
    (
      req: Request<Record<string, string>, unknown, Partial<JoinRequestBody> | undefined>,
      res: Response<JoinRequestResponse | ErrorResponse>,
    ): void => {
      const ip = clientAddress(req);
      if (!withinRateLimit(ip)) {
        res.status(429).json({ error: 'Too many join requests. Try again in a minute.' });
        return;
      }
      const rawName = req.body?.deviceName;
      const deviceName = typeof rawName === 'string' ? rawName.trim() : '';
      if (!deviceName || deviceName.length > MAX_NAME_LENGTH || /\p{Cc}/u.test(deviceName)) {
        res.status(400).json({
          error: `deviceName must be 1 to ${MAX_NAME_LENGTH} characters, without control characters`,
        });
        return;
      }

      const previous = pendingByIp.get(ip);
      if (previous) settle(previous, 'expired');

      const id = randomUUID();
      const controller = new AbortController();
      entries.set(id, { ip, status: 'pending', controller });
      pendingByIp.set(ip, id);
      res.status(202).json({ requestId: id });

      if (token === undefined) {
        settle(id, 'approved');
        logEvent(ip, 'ALLOWED', deviceName);
        return;
      }
      setTimeout((): void => {
        if (settle(id, 'expired')) logEvent(ip, 'EXPIRED', deviceName);
      }, EXPIRE_AFTER_MS).unref();
      approve({ deviceName, ip }, controller.signal)
        .catch((): boolean => false)
        .then((allowed: boolean): void => {
          if (settle(id, allowed ? 'approved' : 'denied')) {
            logEvent(ip, allowed ? 'ALLOWED' : 'DENIED', deviceName);
          }
        });
    },
  );

  router.get(
    '/join/:requestId',
    (
      req: Request<{ requestId: string }>,
      res: Response<JoinStatusResponse | ErrorResponse>,
    ): void => {
      const entry = entries.get(req.params.requestId);
      if (!entry) {
        res.status(404).json({ error: 'Unknown join request' });
        return;
      }
      // The response can carry the access token.
      res.set('Cache-Control', 'no-store');
      if (entry.status === 'approved') res.json({ status: 'approved', token });
      else res.json({ status: entry.status });
    },
  );

  // Malformed JSON in a join request.
  const invalidBody: ErrorRequestHandler = (
    _error: unknown,
    _req: Request,
    res: Response<ErrorResponse>,
    _next: NextFunction,
  ): void => {
    res.status(400).json({ error: 'Invalid JSON body' });
  };
  router.use(invalidBody);

  return router;
}
