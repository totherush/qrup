import fs from 'node:fs';
import path from 'node:path';
import { type Request, type Response, Router } from 'express';
import multer from 'multer';
import type { ErrorResponse, UploadResponse } from '../../shared/api';
import { logAction } from '../lib/logger';
import { moveToFreeName, resolveInside, sanitizeFileName, TEMP_DIR_NAME } from '../lib/paths';

/** Hears about uploads: `started` when an upload request arrives, `finished` when it ends. */
export interface UploadListener {
  started: () => void;
  /** Absolute paths of the files the request saved; empty when it failed or was aborted. */
  finished: (savedPaths: string[]) => void;
}

/**
 * `POST /api/upload` saves the `files` fields of a multipart body.
 * Each file is streamed into the temp folder and only moved into the upload folder once
 * complete, so the file browser never shows half-written files. multer removes temp files
 * of failed or aborted requests. A name that already exists gets a ` (n)` suffix.
 *
 * `DELETE /api/upload/:filename` deletes one file from the upload folder.
 */
export function uploadRouter(uploadDir: string, listener?: UploadListener): Router {
  const tempDir = path.join(uploadDir, TEMP_DIR_NAME);
  // Leftovers from a crash are never completed, so start clean.
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const receiveFiles = multer({
    dest: tempDir,
    // Browsers send UTF-8 file names; multer's default (latin1) garbles names like "Müller.pdf".
    defParamCharset: 'utf8',
  }).array('files');

  const router = Router();

  router.post('/upload', (req: Request, res: Response<UploadResponse | ErrorResponse>): void => {
    let savedPaths: string[] = [];
    listener?.started();
    res.on('close', (): void => listener?.finished(savedPaths));
    receiveFiles(req, res, (error: unknown): void => {
      if (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Upload failed' });
        return;
      }
      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const savedNames = files.map((file: Express.Multer.File): string => {
        const savedName = moveToFreeName(file.path, uploadDir, sanitizeFileName(file.originalname));
        logAction(req, 'UPLOAD', savedName);
        return savedName;
      });
      savedPaths = savedNames.map((name: string): string => path.join(uploadDir, name));
      res.json({ success: true, files: savedNames });
    });
  });

  router.delete(
    '/upload/:filename',
    (
      req: Request<{ filename: string }>,
      res: Response<{ success: true } | ErrorResponse>,
    ): void => {
      const filePath = resolveInside(uploadDir, req.params.filename);
      if (!filePath) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      if (!fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      fs.unlinkSync(filePath);
      logAction(req, 'DELETE', req.params.filename);
      res.json({ success: true });
    },
  );

  return router;
}
