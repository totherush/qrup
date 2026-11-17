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

/** Builds the Express app: the JSON API under `/api` and the built client for every other path. */
export function createApp({ uploadDir, client }: Config): Express {
  const app = express();

  app.use('/api', uploadRouter(uploadDir), filesRouter(uploadDir));
  app.use(serveClient(client));

  return app;
}
