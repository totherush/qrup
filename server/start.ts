import fs from 'node:fs';
import qrcode from 'qrcode-terminal';
import pkg from '../package.json' with { type: 'json' };
import { createApp } from './app';
import { type ClientFiles, type Config, loadConfig } from './config';
import { networkAddresses } from './lib/network';

const HELP = `qrup ${pkg.version}
Move files between your phone and this computer over the local network.

Usage: qrup [options]

Options:
  -p, --port <port>      Port to listen on (default: 3000, or $PORT)
  -u, --upload <folder>  Folder to save uploads to, relative to the current
                         directory (default: ./uploads, or $UPLOAD_FOLDER)
  -h, --help             Show this help
  -v, --version          Show the version

Scan the QR code it prints with your phone. Both devices must be on the same network.`;

function printBanner({ port, uploadDir }: Config): void {
  const [address, ...otherAddresses] = networkAddresses();
  console.log('Server running on:');
  console.log(`  Local:   http://localhost:${port}`);
  if (!address) {
    console.log('  Network: No network interface found');
    console.log(`\nUpload folder: ${uploadDir}\n`);
    return;
  }

  const networkUrl = `http://${address}:${port}`;
  console.log(`  Network: ${networkUrl}`);
  for (const other of otherAddresses) console.log(`           http://${other}:${port}`);
  console.log(`\nUpload folder: ${uploadDir}\n`);
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
  createApp(config).listen(config.port, '0.0.0.0', (): void => printBanner(config));
}
