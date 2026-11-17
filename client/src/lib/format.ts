const UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;

/** Formats a byte count with binary units, such as `3 MB` or `1.25 GB`. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 Bytes';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = Math.round((bytes / 1024 ** exponent) * 100) / 100;
  return `${value} ${UNITS[exponent]}`;
}

/** Formats a remaining duration, such as `8 sec` or `3 min`. */
export function formatSecondsLeft(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} sec`;
  return `${Math.round(seconds / 60)} min`;
}
