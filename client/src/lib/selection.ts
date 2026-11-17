import type { FileNode } from '../../../shared/api';

/** The node's path and the paths of everything below it. */
function subtreePaths(node: FileNode): string[] {
  return [node.path, ...(node.children ?? []).flatMap(subtreePaths)];
}

/** `a` and `a/b` for `a/b/c`. */
function ancestorPaths(path: string): string[] {
  const segments = path.split('/');
  return segments.slice(1).map((_, index) => segments.slice(0, index + 1).join('/'));
}

/**
 * Selecting a node selects everything below it. Deselecting a node also deselects its
 * ancestors, because a selected directory means "all of its contents".
 */
export function toggleSelection(selected: ReadonlySet<string>, node: FileNode): Set<string> {
  const next = new Set(selected);
  if (selected.has(node.path)) {
    for (const path of [...subtreePaths(node), ...ancestorPaths(node.path)]) next.delete(path);
  } else {
    for (const path of subtreePaths(node)) next.add(path);
  }
  return next;
}

export function selectAll(nodes: readonly FileNode[]): Set<string> {
  return new Set(nodes.flatMap(subtreePaths));
}

/** The fewest paths that cover the selection: a selected directory stands for all of its contents. */
export function downloadPaths(nodes: readonly FileNode[], selected: ReadonlySet<string>): string[] {
  return nodes.flatMap((node): string[] =>
    selected.has(node.path) ? [node.path] : downloadPaths(node.children ?? [], selected),
  );
}

export function countSelectedFiles(
  nodes: readonly FileNode[],
  selected: ReadonlySet<string>,
): number {
  return nodes.reduce(
    (count, node) =>
      count +
      (node.type === 'file' && selected.has(node.path) ? 1 : 0) +
      countSelectedFiles(node.children ?? [], selected),
    0,
  );
}
