import os from 'node:os';

/** Private IPv4 ranges a phone on the same Wi-Fi can usually reach. */
const LAN_PATTERN = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** External IPv4 addresses of this machine, LAN addresses first. */
export function networkAddresses(): string[] {
  const addresses = Object.values(os.networkInterfaces())
    .flatMap((nets) => nets ?? [])
    .filter((net) => net.family === 'IPv4' && !net.internal)
    .map((net) => net.address);

  const isLan = (address: string): number => (LAN_PATTERN.test(address) ? 0 : 1);
  return addresses.sort((a, b) => isLan(a) - isLan(b));
}
