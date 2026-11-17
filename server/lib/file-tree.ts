import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileNode } from '../../shared/api';
import { TEMP_DIR_NAME } from './paths';

function compareNodes(a: FileNode, b: FileNode): number {
  if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
  return a.name.localeCompare(b.name);
}

/**
 * Lists `dir` recursively, directories first, then by name.
 * Unreadable entries, symlinks, and the temp folder are skipped.
 */
export async function readFileTree(dir: string, relativeDir = ''): Promise<FileNode[]> {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    console.warn(`Skipping unreadable directory: ${dir}`);
    return [];
  }

  const nodes = await Promise.all(
    entries.map(async (entry): Promise<FileNode | undefined> => {
      if (relativeDir === '' && entry.name === TEMP_DIR_NAME) return undefined;
      const absolute = path.join(dir, entry.name);
      const relative = relativeDir === '' ? entry.name : `${relativeDir}/${entry.name}`;

      if (entry.isDirectory()) {
        const children = await readFileTree(absolute, relative);
        return { name: entry.name, type: 'directory', path: relative, children };
      }
      if (!entry.isFile()) return undefined;

      try {
        const { size } = await fs.stat(absolute);
        return { name: entry.name, type: 'file', path: relative, size };
      } catch {
        console.warn(`Skipping unreadable file: ${absolute}`);
        return undefined;
      }
    }),
  );

  return nodes.filter((node): node is FileNode => node !== undefined).sort(compareNodes);
}
