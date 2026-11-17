import fs from 'node:fs';
import path from 'node:path';

/** Folder inside the upload folder where uploads are written until they complete. Hidden from listings. */
export const TEMP_DIR_NAME = '.qrup-tmp';

/**
 * Resolves a client-supplied relative path inside `rootDir`.
 * Returns `undefined` when the path escapes `rootDir` or points into the temp folder.
 */
export function resolveInside(rootDir: string, relativePath: string): string | undefined {
  const absolute = path.resolve(rootDir, relativePath);
  const relative = path.relative(rootDir, absolute);
  const escapes = relative === '' || relative.startsWith('..') || path.isAbsolute(relative);
  if (escapes || relative.split(path.sep)[0] === TEMP_DIR_NAME) return undefined;
  return absolute;
}

/** Turns a client-supplied file name into a safe single path segment. */
export function sanitizeFileName(name: string): string {
  // Control characters are never valid in file names we want to keep.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
  const cleaned = path.basename(name.replaceAll('\\', '/')).replace(/[\u0000-\u001f]/g, '');
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? 'upload' : cleaned;
}

/**
 * Moves `tempPath` to `dir/fileName`, appending ` (1)`, ` (2)`, … before the extension
 * when that name is taken. Returns the name the file was saved under.
 * The check and the rename are synchronous, so concurrent requests cannot claim the same name.
 */
export function moveToFreeName(tempPath: string, dir: string, fileName: string): string {
  const { name, ext } = path.parse(fileName);
  for (let attempt = 0; ; attempt++) {
    const candidate = attempt === 0 ? fileName : `${name} (${attempt})${ext}`;
    const target = path.join(dir, candidate);
    if (!fs.existsSync(target)) {
      fs.renameSync(tempPath, target);
      return candidate;
    }
  }
}
