import fs from 'node:fs';
import path from 'node:path';
import { ZipArchive } from 'archiver';
import { type Request, type Response, Router } from 'express';
import type { ErrorResponse, FileListResponse } from '../../shared/api';
import { readFileTree } from '../lib/file-tree';
import { logAction } from '../lib/logger';
import { resolveInside } from '../lib/paths';

interface Selection {
  absolute: string;
  relative: string;
  isDirectory: boolean;
}

/** Normalizes `?files=a&files=b` into a list of strings. */
function queryList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.filter((item): item is string => typeof item === 'string' && item !== '');
}

/** Resolves the requested paths, dropping ones that escape the upload folder or do not exist. */
function resolveSelection(uploadDir: string, relativePaths: string[]): Selection[] {
  return relativePaths.flatMap((relative): Selection[] => {
    const absolute = resolveInside(uploadDir, relative);
    const stats = absolute ? fs.statSync(absolute, { throwIfNoEntry: false }) : undefined;
    if (!absolute || !stats || (!stats.isFile() && !stats.isDirectory())) return [];
    return [{ absolute, relative, isDirectory: stats.isDirectory() }];
  });
}

/**
 * `GET /api/files` lists the upload folder as a tree.
 *
 * `GET /api/download?files=…` sends one file as is. Several entries, or a directory, are sent
 * as one ZIP stream that contains each directory with all its contents.
 */
export function filesRouter(uploadDir: string): Router {
  const router = Router();

  router.get('/files', async (_req: Request, res: Response<FileListResponse>): Promise<void> => {
    res.json({ files: await readFileTree(uploadDir) });
  });

  router.get('/download', (req: Request, res: Response<ErrorResponse>): void => {
    const selection = resolveSelection(uploadDir, queryList(req.query.files));
    const [first] = selection;
    if (!first) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    if (selection.length === 1 && !first.isDirectory) {
      logAction(req, 'DOWNLOAD', first.relative);
      res.download(first.absolute, path.basename(first.absolute));
      return;
    }

    const zipName = selection.length === 1 ? `${path.basename(first.absolute)}.zip` : 'files.zip';
    // Uploads are mostly photos and videos, which do not compress; level 1 keeps zipping fast.
    const archive = new ZipArchive({ zlib: { level: 1 } });
    archive.on('warning', (error: Error): void => console.warn('ZIP warning:', error.message));
    archive.on('error', (error: Error): void => {
      console.error('ZIP error:', error.message);
      res.destroy(error);
    });

    res.attachment(zipName);
    archive.pipe(res);
    for (const entry of selection) {
      if (entry.isDirectory) archive.directory(entry.absolute, entry.relative);
      else archive.file(entry.absolute, { name: entry.relative });
    }
    logAction(req, 'DOWNLOAD', `${zipName} (${selection.length} entries)`);
    void archive.finalize();
  });

  return router;
}
