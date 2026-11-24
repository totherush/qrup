import os from 'node:os';
import ciao from '@homebridge/ciao';
import type { DiscoveryTxtRecord } from '../../shared/api';

/**
 * Advertises the server on the local network as a `_qrup._tcp` DNS-SD service named after the
 * computer, so the qrup app can find it. Returns a function that withdraws the service.
 */
export function advertise(port: number, open: boolean): () => Promise<void> {
  const warn = (error: unknown): void => {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Could not advertise qrup on the local network: ${reason}`);
  };
  // macOS host names often end in `.local`, which would only repeat the mDNS domain.
  const name = os.hostname().replace(/\.local\.?$/i, '');
  const txt: DiscoveryTxtRecord = { v: '1', name, open: open ? '1' : '0' };
  const responder = ciao.getResponder();
  try {
    const service = responder.createService({
      name,
      type: 'qrup',
      port,
      txt,
      // A host name of its own, so it never competes with the computer's `<name>.local` record.
      hostname: `qrup-${name.replaceAll('.', '-')}`,
    });
    service.on('name-change', (newName: string): void => {
      console.warn(`Another device on the network uses this name; announced as "${newName}".`);
    });
    service.advertise().catch(warn);
  } catch (error: unknown) {
    warn(error);
  }
  return (): Promise<void> => responder.shutdown();
}
