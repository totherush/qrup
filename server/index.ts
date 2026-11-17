import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import qrcode from 'qrcode-terminal';
import { createApp } from './app';
import { type Config, loadConfig } from './config';
import { networkAddresses } from './lib/network';

// Bundled, this file is `dist/server.js` next to `dist/client`; from source it is `server/index.ts`.
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDir =
  path.basename(here) === 'dist'
    ? path.join(here, 'client')
    : path.join(here, '..', 'dist', 'client');

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

const config = loadConfig(process.argv.slice(2), process.env, clientDir);
fs.mkdirSync(config.uploadDir, { recursive: true });
createApp(config).listen(config.port, '0.0.0.0', (): void => printBanner(config));
