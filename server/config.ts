import path from 'node:path';

export interface Config {
  port: number;
  /** Absolute path of the folder uploads are saved to. */
  uploadDir: string;
  /** Absolute path of the built client (`dist/client`). */
  clientDir: string;
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
  clientDir: string,
): Config {
  const port = readFlag(args, '--port', '-p') ?? env.PORT ?? String(DEFAULT_PORT);
  const uploadFolder =
    readFlag(args, '--upload', '-u') ?? env.UPLOAD_FOLDER ?? DEFAULT_UPLOAD_FOLDER;

  return {
    port: parsePort(port),
    uploadDir: path.resolve(uploadFolder),
    clientDir,
  };
}
