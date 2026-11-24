import fs from 'node:fs';
import qrcode from 'qrcode-terminal';
import pkg from '../package.json' with { type: 'json' };
import { createApp } from './app';
import { type ClientFiles, type Config, loadConfig } from './config';
import { advertise } from './lib/discovery';
import { networkAddresses } from './lib/network';
import { approveInTerminal } from './lib/terminal-approval';

const HELP = `qrup ${pkg.version}
Move files between your phone and this computer over the local network.

Usage: qrup [options]

Options:
  -p, --port <port>      Port to listen on (default: 3000, or $PORT)
  -u, --upload <folder>  Folder to save uploads to, relative to the current
                         directory (default: ./uploads, or $UPLOAD_FOLDER)
      --open             Let anyone on the network connect, without the access
                         code in the QR code (or set QRUP_OPEN=1)
  -h, --help             Show this help
  -v, --version          Show the version

Scan the QR code it prints with your phone. Both devices must be on the same network.
Only devices that open the printed address, which contains a new access code on every
start, can connect.

The qrup app also finds qrup on the network by itself. When it asks to connect, qrup
asks you in this terminal whether to allow it.`;

const useColor: boolean = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const yellow = (text: string): string => (useColor ? `\x1b[33m${text}\x1b[0m` : text);

function printBanner({ port, uploadDir, token }: Config): void {
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
  if (!address) return;

  const networkUrl = `http://${address}:${port}${query}`;
  console.log('Scan QR code with your mobile device:\n');
  qrcode.generate(networkUrl, { small: true });
  console.log('\nActivity log:');
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
  fs.mkdirSync(config.uploadDir, { recursive: true });
  createApp(config, approveInTerminal).listen(config.port, '0.0.0.0', (): void => {
    printBanner(config);
    const stopAdvertising = advertise(config.port, config.token === undefined);
    // Withdraw the service so the app stops listing this computer, then exit.
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.once(signal, (): void => {
        setTimeout((): never => process.exit(0), 1000).unref();
        stopAdvertising().finally((): never => process.exit(0));
      });
    }
  });
}
