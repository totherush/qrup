import { timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import type { ClientFiles, Config } from './config';
import { filesRouter } from './routes/files';
import { uploadRouter } from './routes/upload';

/** Serves the client from a folder, falling back to `index.html` for every unknown path. */
function serveFolder(dir: string): RequestHandler[] {
  const sendIndex = (_req: Request, res: Response): void => {
    res.sendFile(path.join(dir, 'index.html'));
  };
  return [express.static(dir), sendIndex];
}

/** Serves the client from files embedded in a compiled binary, with the same `index.html` fallback. */
function serveEmbedded(files: Readonly<Record<string, string>>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const filePath = files[req.path] ?? files['/index.html'];
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !filePath) {
      next();
      return;
    }
    res.type(path.extname(filePath)).send(fs.readFileSync(filePath));
  };
}

function serveClient(client: ClientFiles): RequestHandler | RequestHandler[] {
  return 'dir' in client ? serveFolder(client.dir) : serveEmbedded(client.embedded);
}

/**
 * Rejects `/api` requests without the access token, sent as the `x-qrup-token` header or, for
 * download links, as the `t` query parameter.
 */
function requireToken(token: string): RequestHandler {
  const expected = Buffer.from(token);
  return (req: Request, res: Response, next: NextFunction): void => {
    const query = req.query.t;
    const given = Buffer.from(req.get('x-qrup-token') ?? (typeof query === 'string' ? query : ''));
    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      next();
      return;
    }
    res.status(401).json({ error: 'Access denied. Scan the QR code that qrup shows again.' });
  };
}

/** Builds the Express app: the JSON API under `/api` and the built client for every other path. */
export function createApp({ uploadDir, client, token }: Config): Express {
  const app = express();

  const guard = token === undefined ? [] : [requireToken(token)];
  app.use('/api', ...guard, uploadRouter(uploadDir), filesRouter(uploadDir));
  app.use(serveClient(client));

  return app;
}
