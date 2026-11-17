import path from 'node:path';
import express, { type Express, type Request, type Response } from 'express';
import type { Config } from './config';
import { filesRouter } from './routes/files';
import { uploadRouter } from './routes/upload';

/** Builds the Express app: the JSON API under `/api` and the built client for every other path. */
export function createApp({ uploadDir, clientDir }: Config): Express {
  const app = express();

  app.use('/api', uploadRouter(uploadDir), filesRouter(uploadDir));
  app.use(express.static(clientDir));
  app.get('/*splat', (_req: Request, res: Response): void => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });

  return app;
}
