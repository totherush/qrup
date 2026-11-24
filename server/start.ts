import fs from 'node:fs';
import qrcode from 'qrcode-terminal';
import pkg from '../package.json' with { type: 'json' };
import { createApp } from './app';
import { type ClientFiles, type Config, loadConfig } from './config';
import { advertise } from './lib/discovery';
import { printJson, setJsonOutput } from './lib/logger';
import { networkAddresses } from './lib/network';
import { approveInTerminal } from './lib/terminal-approval';
import type { UploadListener } from './routes/upload';

const HELP = `qrup ${pkg.version}
Move files between your phone and this computer over the local network.

Usage: qrup [options]

Options:
  -p, --port <port>      Port to listen on (default: 3000, or $PORT)
  -u, --upload <folder>  Folder to save uploads to, relative to the current
                         directory (default: ./uploads, or $UPLOAD_FOLDER)
      --open             Let anyone on the network connect, without the access
                         code in the QR code (or set QRUP_OPEN=1)
      --any-network      Also accept devices outside the local network, such as
                         over a VPN like Tailscale (or set QRUP_ANY_NETWORK=1)
      --json             Print JSON lines instead of the banner and QR code: the
                         addresses on start, then every activity (for scripts
                         and agents)
      --exit-after-upload
                         Exit once the first upload is done: no upload running
                         and none started for 3 seconds
      --timeout <min>    Exit with code 2 when no file has arrived after <min>
                         minutes (a running upload holds it off)
  -h, --help             Show this help
  -v, --version          Show the version

Scan the QR code it prints with your phone. Both devices must be on the same network:
qrup refuses devices with a public, carrier-grade NAT, or VPN address unless you pass
--any-network.
Only devices that open the printed address, which contains a new access code on every
start, can connect.

The qrup app also finds qrup on the network by itself. When it asks to connect, qrup
asks you in this terminal whether to allow it.`;

const useColor: boolean = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const yellow = (text: string): string => (useColor ? `\x1b[33m${text}\x1b[0m` : text);

/** Prints the addresses as one JSON line for `--json`, in place of the banner. */
function printListening({ port, uploadDir, token, anyNetwork }: Config): void {
  const query = token === undefined ? '' : `/?t=${token}`;
  const networkUrls = networkAddresses().map(
    (address: string): string => `http://${address}:${port}${query}`,
  );
  printJson({
    event: 'listening',
    version: pkg.version,
    port,
    url: networkUrls[0] ?? null,
    localUrl: `http://localhost:${port}${query}`,
    networkUrls,
    token: token ?? null,
    uploadDir,
    open: token === undefined,
    anyNetwork,
  });
}

function printBanner({ port, uploadDir, token, anyNetwork }: Config): void {
  const [address, ...otherAddresses] = networkAddresses();
  const query = token === undefined ? '' : `/?t=${token}`;
  console.log('Server running on:');
  console.log(`  Local:   http://localhost:${port}${query}`);
  if (address) {
    console.log(`  Network: http://${address}:${port}${query}`);
    for (const other of otherAddresses) console.log(`           http://${other}:${port}${query}`);
  } else {
    console.log('  Network: No network interface found');
  }
  console.log(`\nUpload folder: ${uploadDir}\n`);
  if (token === undefined) {
    console.log(
      yellow('⚠ Open mode: anyone on this network can list, download, and delete these files.\n'),
    );
  }
  if (anyNetwork) {
    console.log(
      yellow(
        '⚠ Any network: devices outside the local network, such as over a VPN, can connect.\n',
      ),
    );
  }
  if (!address) return;

  const networkUrl = `http://${address}:${port}${query}`;
  console.log('Scan QR code with your mobile device:\n');
  qrcode.generate(networkUrl, { small: true });
  console.log('\nActivity log:');
}

/** How long uploads must be quiet before `--exit-after-upload` exits. */
const UPLOAD_QUIET_MS = 3000;

type ExitReason = 'uploaded' | 'timeout';

/**
 * Watches uploads for `--exit-after-upload` and `--timeout`, and calls `exit` once:
 * - `uploaded` with the saved files when `exitAfterUpload` is set, at least one file is saved, no
 *   upload is running, and none started for `UPLOAD_QUIET_MS`. The client sends the files a person
 *   picked at once one after another, so the wait keeps them together.
 * - `timeout` when `timeoutMs` passes without a saved file. A running upload holds it off, and a
 *   failed or cancelled one starts the wait again.
 */
function watchUploads(
  exitAfterUpload: boolean,
  timeoutMs: number | undefined,
  exit: (reason: ExitReason, files: string[]) => void,
): UploadListener {
  const files: string[] = [];
  let running = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let exited = false;
  const exitAfter = (reason: ExitReason, ms: number): void => {
    timer = setTimeout((): void => {
      if (exited) return;
      exited = true;
      exit(reason, files);
    }, ms);
  };
  const whenIdle = (): void => {
    if (files.length > 0) {
      if (exitAfterUpload) exitAfter('uploaded', UPLOAD_QUIET_MS);
    } else if (timeoutMs !== undefined) {
      exitAfter('timeout', timeoutMs);
    }
  };
  whenIdle();
  return {
    started: (): void => {
      running++;
      clearTimeout(timer);
    },
    finished: (savedPaths: string[]): void => {
      running--;
      files.push(...savedPaths);
      if (running === 0) whenIdle();
    },
  };
}

/**
 * Reads the CLI flags and environment, then starts the server and prints its URLs and QR code.
 * Called by `index.ts` (client from `dist/client`) and by the compiled binary (embedded client).
 */
export function start(client: ClientFiles): void {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    return;
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log(pkg.version);
    return;
  }

  const config = loadConfig(args, process.env, client);
  if (config.json) setJsonOutput();
  fs.mkdirSync(config.uploadDir, { recursive: true });

  let stopAdvertising = (): Promise<void> => Promise.resolve();
  // Withdraw the service so the app stops listing this computer, then exit.
  const shutdown = (code: number): void => {
    setTimeout((): never => process.exit(code), 1000).unref();
    stopAdvertising().finally((): never => process.exit(code));
  };
  const { exitAfterUpload, timeoutMinutes } = config;
  const onUpload =
    exitAfterUpload || timeoutMinutes !== undefined
      ? watchUploads(
          exitAfterUpload,
          timeoutMinutes === undefined ? undefined : timeoutMinutes * 60_000,
          (reason: ExitReason, files: string[]): void => {
            if (config.json) printJson({ event: 'exit', reason, files });
            else if (reason === 'uploaded') {
              console.log(`\nReceived ${files.length} file(s); exiting.`);
            } else console.log(`\nNo file arrived within ${timeoutMinutes} minute(s); exiting.`);
            // Code 2 tells a script that nothing arrived.
            shutdown(reason === 'uploaded' ? 0 : 2);
          },
        )
      : undefined;

  createApp(config, approveInTerminal, onUpload).listen(config.port, '0.0.0.0', (): void => {
    if (config.json) printListening(config);
    else printBanner(config);
    stopAdvertising = advertise(config.port, config.token === undefined);
    for (const signal of ['SIGINT', 'SIGTERM'] as const)
      process.once(signal, (): void => shutdown(0));
  });
}
