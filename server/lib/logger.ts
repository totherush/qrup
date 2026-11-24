import type { Request } from 'express';

export type Action =
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'DELETE'
  | 'ALLOWED'
  | 'DENIED'
  | 'EXPIRED'
  | 'REFUSED';

const useColor: boolean = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

/** With `--json`, stdout carries only JSON lines, one per event. */
let jsonOutput = false;

/** Switches the activity log to JSON lines, for `--json`. */
export function setJsonOutput(): void {
  jsonOutput = true;
}

/** Prints `event` as one JSON line on stdout. */
export function printJson(event: object): void {
  console.log(JSON.stringify(event));
}

function paint(code: string, text: string): string {
  return useColor ? `\x1b[${code}m${text}\x1b[0m` : text;
}

const ACTION_COLOR: Record<Action, string> = {
  UPLOAD: '32', // green
  DOWNLOAD: '36', // cyan
  DELETE: '31', // red
  ALLOWED: '32', // green
  DENIED: '31', // red
  EXPIRED: '33', // yellow
  REFUSED: '31', // red
};

function timestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** The IP address a request comes from, such as `192.168.1.5`. */
export function clientAddress(req: Request): string {
  const address = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  return address.replace('::ffff:', '');
}

/**
 * Prints one line of the activity log, such as `2026-11-17 11:35:00 INFO 192.168.1.5 DENIED "Pixel 9"`,
 * or with `--json` `{"event":"activity","time":"…","address":"192.168.1.5","action":"DENIED","subject":"Pixel 9"}`.
 */
export function logEvent(address: string, action: Action, subject: string): void {
  if (jsonOutput) {
    printJson({ event: 'activity', time: new Date().toISOString(), address, action, subject });
    return;
  }
  const columns = [
    paint('2', timestamp(new Date())),
    'INFO ',
    address.padEnd(21),
    paint(ACTION_COLOR[action], action.padEnd(9)),
    `"${subject}"`,
  ];
  console.info(columns.join(' '));
}

/** Logs what a request did, such as `2026-11-17 11:35:00 INFO 192.168.1.5 UPLOAD "a.jpg"`. */
export function logAction(req: Request, action: Action, subject: string): void {
  logEvent(clientAddress(req), action, subject);
}
