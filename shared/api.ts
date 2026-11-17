/**
 * Types shared by the server and the browser client.
 * They describe the JSON bodies of the `/api/*` endpoints.
 */

/** One entry in the upload folder, as returned by `GET /api/files`. */
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  /** Path relative to the upload folder, always with `/` separators. */
  path: string;
  /** Size in bytes; only set for files. */
  size?: number;
  /** Entries of a directory; only set for directories. */
  children?: FileNode[];
}

export interface FileListResponse {
  files: FileNode[];
}

/** Response of `POST /api/upload`. */
export interface UploadResponse {
  success: true;
  /** Names the files were saved under, in upload order. Differs from the original name on conflicts. */
  files: string[];
}

/** Body of every non-2xx JSON response. */
export interface ErrorResponse {
  error: string;
}
