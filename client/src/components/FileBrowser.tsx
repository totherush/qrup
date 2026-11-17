import { type JSX, useCallback, useEffect, useState } from 'react';
import type { FileNode } from '../../../shared/api';
import { downloadUrl, fetchFileTree } from '../api';
import { countSelectedFiles, downloadPaths, selectAll, toggleSelection } from '../lib/selection';
import { FileTreeNode } from './FileTreeNode';
import { RefreshIcon } from './Icons';

interface FileBrowserProps {
  /** Changing this value reloads the list. */
  refreshKey: number;
}

/** Starts a download the browser streams to disk, instead of buffering the file in memory. */
function startDownload(paths: readonly string[]): void {
  const link = document.createElement('a');
  link.href = downloadUrl(paths);
  link.download = '';
  link.click();
}

export function FileBrowser({ refreshKey }: FileBrowserProps): JSX.Element {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async (): Promise<void> => {
    setError(undefined);
    try {
      setFiles(await fetchFileTree());
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey exists to trigger a reload
  useEffect((): void => {
    void load();
  }, [load, refreshKey]);

  const selectedCount = countSelectedFiles(files, selected);
  const hasSelection = selected.size > 0;

  const handleDownload = (): void => {
    startDownload(downloadPaths(files, selected));
    setSelected(new Set());
  };

  return (
    <section className="bg-white rounded-xl p-8 shadow-sm h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">File Browser</h2>
            <p className="text-sm text-gray-500">Uploaded files</p>
          </div>
          <button
            type="button"
            onClick={(): void => void load()}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Refresh files"
          >
            <RefreshIcon />
          </button>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={(): void => setSelected(hasSelection ? new Set() : selectAll(files))}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              {hasSelection ? 'Deselect All' : 'Select All'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!hasSelection}
              className="px-4 py-1.5 text-sm font-medium rounded transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {selectedCount > 0 ? `Download (${selectedCount})` : 'Download'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading files...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Upload folder is empty</div>
      ) : (
        <ul className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto p-2">
          {files.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              selected={selected}
              onToggle={(target: FileNode): void =>
                setSelected((prev) => toggleSelection(prev, target))
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
