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

/**
 * Body of `POST /api/join`, which asks the person at the computer to let a device connect.
 * Needs no access token. `deviceName` is trimmed and must then be 1 to 64 characters long,
 * without control characters.
 */
export interface JoinRequestBody {
  deviceName: string;
}

/** Response of `POST /api/join` (status 202). Poll `GET /api/join/:requestId` with the ID. */
export interface JoinRequestResponse {
  requestId: string;
}

/** A join request is pending until it is approved or denied, or expires after 2 minutes. */
export type JoinStatus = 'pending' | 'approved' | 'denied' | 'expired';

/**
 * Response of `GET /api/join/:requestId`, which needs no access token. An approved request carries
 * the access token for every other `/api` request, unless the server runs in open mode, which
 * needs none.
 */
export type JoinStatusResponse =
  | { status: Exclude<JoinStatus, 'approved'> }
  | { status: 'approved'; token?: string };

/**
 * TXT record of the `_qrup._tcp` DNS-SD service a running server advertises on its port, with
 * the computer's name as instance name. `open` is `'1'` when the server needs no access token.
 */
export type DiscoveryTxtRecord = {
  v: '1';
  name: string;
  open: '0' | '1';
};
