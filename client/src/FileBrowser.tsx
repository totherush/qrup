import { useCallback, useEffect, useState } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

interface FileBrowserProps {
  refreshTrigger?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

function FileTreeNode({
  node,
  level = 0,
  selectedFiles,
  onToggleSelect,
}: {
  node: FileNode;
  level?: number;
  selectedFiles: Set<string>;
  onToggleSelect: (path: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFiles.has(node.path);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(node.path);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded ${level > 0 ? 'ml-4' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          onClick={handleCheckboxClick}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
        <div
          className="flex items-center gap-2 flex-1 cursor-pointer"
          onClick={() => node.type === 'directory' && setIsExpanded(!isExpanded)}
        >
          {node.type === 'directory' && (
            <span className="text-gray-600 text-sm">{isExpanded ? '📂' : '📁'}</span>
          )}
          <span className="text-sm text-gray-900 flex-1 truncate">{node.name}</span>
          {node.type === 'file' && node.size !== undefined && (
            <span className="text-xs text-gray-500">{formatFileSize(node.size)}</span>
          )}
        </div>
      </div>
      {node.type === 'directory' && isExpanded && hasChildren && (
        <div>
          {node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedFiles={selectedFiles}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function collectAllFilePaths(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      paths.push(node.path);
    }
    if (node.children) {
      paths.push(...collectAllFilePaths(node.children));
    }
  }
  return paths;
}

export default function FileBrowser({ refreshTrigger }: FileBrowserProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger intentionally triggers refetch
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshTrigger]);

  const handleToggleSelect = (path: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedFiles.size > 0) {
      setSelectedFiles(new Set());
    } else {
      const allFilePaths = collectAllFilePaths(files);
      setSelectedFiles(new Set(allFilePaths));
    }
  };

  const handleDownload = async () => {
    if (selectedFiles.size === 0) return;

    try {
      setDownloading(true);
      const filePaths = Array.from(selectedFiles);

      const params = new URLSearchParams();
      for (const file of filePaths) {
        params.append('files', file);
      }

      const response = await fetch(`/api/download?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      } else {
        filename =
          filePaths.length === 1 ? filePaths[0].split('/').pop() || 'download' : 'files.zip';
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSelectedFiles(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download files');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">File Browser</h2>
            <p className="text-sm text-gray-500">Uploaded files</p>
          </div>
          <button
            type="button"
            onClick={fetchFiles}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Refresh files"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              {selectedFiles.size > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedFiles.size === 0 || downloading}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                selectedFiles.size === 0 || downloading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {downloading
                ? 'Downloading...'
                : `Download ${selectedFiles.size > 0 ? `(${selectedFiles.size})` : ''}`}
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
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto p-2">
            {files.map((file) => (
              <FileTreeNode
                key={file.path}
                node={file}
                selectedFiles={selectedFiles}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
