import fs from 'node:fs';
import qrcode from 'qrcode-terminal';
import { createApp } from './app';
import { type ClientFiles, type Config, loadConfig } from './config';
import { networkAddresses } from './lib/network';

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
  const config = loadConfig(process.argv.slice(2), process.env, client);
  fs.mkdirSync(config.uploadDir, { recursive: true });
  createApp(config).listen(config.port, '0.0.0.0', (): void => printBanner(config));
}
