import type { Request } from 'express';

export type Action = 'UPLOAD' | 'DOWNLOAD' | 'DELETE';

const useColor: boolean = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function paint(code: string, text: string): string {
  return useColor ? `\x1b[${code}m${text}\x1b[0m` : text;
}

const ACTION_COLOR: Record<Action, string> = {
  UPLOAD: '32', // green
  DOWNLOAD: '36', // cyan
  DELETE: '31', // red
};

function timestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function clientAddress(req: Request): string {
  const address = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  return address.replace('::ffff:', '');
}

/** Prints one line of the activity log, such as `2026-11-17 11:35:00 INFO 192.168.1.5 UPLOAD "a.jpg"`. */
export function logAction(req: Request, action: Action, subject: string): void {
  const columns = [
    paint('2', timestamp(new Date())),
    'INFO ',
    clientAddress(req).padEnd(21),
    paint(ACTION_COLOR[action], action.padEnd(9)),
    `"${subject}"`,
  ];
  console.info(columns.join(' '));
}
