import type { ErrorResponse, FileListResponse, FileNode, UploadResponse } from '../../shared/api';

const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000;

export interface UploadRequest {
  /** Resolves with the name the server saved the file under. */
  done: Promise<string>;
  abort: () => void;
}

/** Thrown by an aborted upload, so callers can tell it from a failure. */
export class UploadAbortedError extends Error {
  constructor() {
    super('Upload cancelled');
  }
}

function errorMessage(body: unknown, fallback: string): string {
  const error = (body as Partial<ErrorResponse> | null)?.error;
  return typeof error === 'string' ? error : fallback;
}

/**
 * Uploads one file with `XMLHttpRequest`, because `fetch` cannot report upload progress.
 * `onProgress` receives the uploaded fraction (0 to 1).
 */
export function uploadFile(file: File, onProgress: (fraction: number) => void): UploadRequest {
  const xhr = new XMLHttpRequest();
  const done = new Promise<string>((resolve, reject): void => {
    xhr.responseType = 'json';
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.upload.onprogress = (event: ProgressEvent): void => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = (): void => {
      const body: unknown = xhr.response;
      const savedName = (body as Partial<UploadResponse> | null)?.files?.[0];
      if (xhr.status >= 200 && xhr.status < 300 && savedName) resolve(savedName);
      else reject(new Error(errorMessage(body, 'Upload failed')));
    };
    xhr.onerror = (): void => reject(new Error('Upload failed'));
    xhr.ontimeout = (): void => reject(new Error('Upload timed out'));
    xhr.onabort = (): void => reject(new UploadAbortedError());

    const body = new FormData();
    body.append('files', file);
    xhr.open('POST', '/api/upload');
    xhr.send(body);
  });
  return { done, abort: (): void => xhr.abort() };
}

export async function deleteUploadedFile(name: string): Promise<void> {
  const response = await fetch(`/api/upload/${encodeURIComponent(name)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(errorMessage(await response.json(), 'Delete failed'));
}

export async function fetchFileTree(): Promise<FileNode[]> {
  const response = await fetch('/api/files');
  if (!response.ok) throw new Error('Failed to load files');
  const body = (await response.json()) as FileListResponse;
  return body.files;
}

/** URL that downloads the given paths: one file as is, anything else as a ZIP. */
export function downloadUrl(paths: readonly string[]): string {
  const params = new URLSearchParams();
  for (const path of paths) params.append('files', path);
  return `/api/download?${params.toString()}`;
}
