import { isIPv4, isIPv6 } from 'node:net';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { logEvent } from './logger';

/** The four octets of a dotted IPv4 address. */
function ipv4Octets(address: string): number[] {
  return address.split('.').map(Number);
}

function isLocalIPv4(address: string): boolean {
  const [a = 0, b = 0] = ipv4Octets(address);
  return (
    a === 127 || // loopback
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) // link-local
  );
}

/** The eight 16-bit groups of an IPv6 address, with `::` expanded and a dotted IPv4 tail converted. */
function ipv6Groups(address: string): number[] {
  const dotted = /(\d+\.\d+\.\d+\.\d+)$/.exec(address)?.[1];
  let hex = address;
  if (dotted) {
    const [a = 0, b = 0, c = 0, d = 0] = ipv4Octets(dotted);
    hex = `${address.slice(0, -dotted.length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head = '', tail] = hex.split('::');
  const parse = (part: string): number[] =>
    part === '' ? [] : part.split(':').map((group) => Number.parseInt(group, 16));
  const start = parse(head);
  const end = tail === undefined ? [] : parse(tail);
  return [...start, ...Array<number>(8 - start.length - end.length).fill(0), ...end];
}

/**
 * Whether `address` belongs to a device on the local network: loopback, private IPv4 (10/8,
 * 172.16/12, 192.168/16), link-local (169.254/16, fe80::/10), or an IPv6 unique local address
 * (fc00::/7). An IPv4-mapped IPv6 address (`::ffff:a.b.c.d`) counts as its IPv4 address.
 * Carrier-grade NAT (100.64/10, also used by Tailscale), public addresses, and anything that is
 * not an IP address are not local.
 */
export function isLocalNetworkAddress(address: string): boolean {
  const ip = address.replace(/%.*$/, '').toLowerCase(); // drop a zone index such as %en0
  if (isIPv4(ip)) return isLocalIPv4(ip);
  if (!isIPv6(ip)) return false;

  const groups = ipv6Groups(ip);
  const [g0 = 0, , , , , g5 = 0, g6 = 0, g7 = 0] = groups;
  if (groups.slice(0, 5).every((group) => group === 0) && g5 === 0xffff) {
    return isLocalIPv4(`${g6 >> 8}.${g6 & 0xff}.${g7 >> 8}.${g7 & 0xff}`);
  }
  return (
    (groups.slice(0, 7).every((group) => group === 0) && g7 === 1) || // ::1
    (g0 & 0xffc0) === 0xfe80 || // link-local
    (g0 & 0xfe00) === 0xfc00 // unique local
  );
}

export const REFUSED_MESSAGE = 'qrup only accepts devices on the same network.';

/**
 * Refuses every request whose connection does not come from the local network with 403, and logs
 * the first refused request from each address. Uses the socket's address, never X-Forwarded-For.
 */
export function localNetworkOnly(): RequestHandler {
  const logged = new Set<string>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const address = req.socket.remoteAddress ?? '';
    if (isLocalNetworkAddress(address)) {
      next();
      return;
    }
    if (!logged.has(address)) {
      logged.add(address);
      logEvent(address.replace('::ffff:', '') || 'unknown', 'REFUSED', `${req.method} ${req.path}`);
    }
    res.status(403);
    if (req.path.startsWith('/api/') || req.path === '/api') {
      res.json({ error: REFUSED_MESSAGE });
    } else {
      res.type('text/plain').send(REFUSED_MESSAGE);
    }
  };
}
