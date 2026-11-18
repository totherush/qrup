import { randomBytes } from 'node:crypto';
import path from 'node:path';

/**
 * The built client: a folder on disk (`dist/client`), or the files embedded in a compiled
 * binary, keyed by URL path such as `/assets/index-abc.js`.
 */
export type ClientFiles = { dir: string } | { embedded: Readonly<Record<string, string>> };

export interface Config {
  port: number;
  /** Absolute path of the folder uploads are saved to. */
  uploadDir: string;
  client: ClientFiles;
  /**
   * Access token every `/api` request must carry; it is part of the QR code URL.
   * `undefined` in open mode (`--open` or `QRUP_OPEN=1`), where anyone on the network can connect.
   */
  token: string | undefined;
}

const DEFAULT_PORT = 3000;
const DEFAULT_UPLOAD_FOLDER = 'uploads';

/** Returns the value after `--long` or `-short` in `args`, if any. */
function readFlag(args: readonly string[], long: string, short: string): string | undefined {
  for (const flag of [long, short]) {
    const index = args.indexOf(flag);
    const value = index === -1 ? undefined : args[index + 1];
    if (value !== undefined && !value.startsWith('-')) return value;
  }
  return undefined;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

/**
 * Builds the configuration from CLI flags, then environment variables, then defaults.
 * A relative upload folder is resolved against the current working directory.
 */
export function loadConfig(
  args: readonly string[],
  env: NodeJS.ProcessEnv,
  client: ClientFiles,
): Config {
  const port = readFlag(args, '--port', '-p') ?? env.PORT ?? String(DEFAULT_PORT);
  const uploadFolder =
    readFlag(args, '--upload', '-u') ?? env.UPLOAD_FOLDER ?? DEFAULT_UPLOAD_FOLDER;

  const open = args.includes('--open') || ['1', 'true'].includes(env.QRUP_OPEN ?? '');
  // A new random token per run, unless QRUP_TOKEN fixes one (used by the E2E tests).
  const token = open ? undefined : env.QRUP_TOKEN || randomBytes(18).toString('base64url');

  return {
    port: parsePort(port),
    uploadDir: path.resolve(uploadFolder),
    client,
    token,
  };
}
