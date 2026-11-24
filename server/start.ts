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

/**
 * Calls `exit` with the saved files once the first upload is done: at least one file saved, no
 * upload running, and none started for `UPLOAD_QUIET_MS`. The client sends the files a person
 * picked at once one after another, so the wait keeps them together.
 */
function exitWhenUploadsSettle(exit: (files: string[]) => void): UploadListener {
  const files: string[] = [];
  let running = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let exited = false;
  return {
    started: (): void => {
      running++;
      clearTimeout(timer);
    },
    finished: (savedPaths: string[]): void => {
      running--;
      files.push(...savedPaths);
      if (running === 0 && files.length > 0 && !exited) {
        timer = setTimeout((): void => {
          exited = true;
          exit(files);
        }, UPLOAD_QUIET_MS);
      }
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
  const shutdown = (): void => {
    setTimeout((): never => process.exit(0), 1000).unref();
    stopAdvertising().finally((): never => process.exit(0));
  };
  const onUpload = config.exitAfterUpload
    ? exitWhenUploadsSettle((files: string[]): void => {
        if (config.json) printJson({ event: 'exit', reason: 'uploaded', files });
        else console.log(`\nReceived ${files.length} file(s); exiting.`);
        shutdown();
      })
    : undefined;

  createApp(config, approveInTerminal, onUpload).listen(config.port, '0.0.0.0', (): void => {
    if (config.json) printListening(config);
    else printBanner(config);
    stopAdvertising = advertise(config.port, config.token === undefined);
    for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, shutdown);
  });
}
