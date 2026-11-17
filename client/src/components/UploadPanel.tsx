import {
  type ChangeEvent,
  type DragEvent,
  type JSX,
  type MouseEvent,
  useRef,
  useState,
} from 'react';
import { useUploadQueue } from '../hooks/useUploadQueue';
import { UploadRow } from './UploadRow';

interface UploadPanelProps {
  /** Called after each file finishes uploading or is deleted, so the file browser can refresh. */
  onFilesChanged: () => void;
}

export function UploadPanel({ onFilesChanged }: UploadPanelProps): JSX.Element {
  const queue = useUploadQueue(onFilesChanged);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPending = queue.items.some((item) => item.status === 'pending');

  const handleDragOver = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>): void => {
    // Moving onto a child element fires dragleave on the parent; ignore that.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    setDragOver(false);
    queue.add(Array.from(event.dataTransfer.files));
  };

  const handleSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    queue.add(Array.from(event.target.files ?? []));
    // Reset so selecting the same file again fires `change`.
    event.target.value = '';
  };

  return (
    <section className="bg-white rounded-xl p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Upload Files</h1>
        <p className="text-sm text-gray-500">To your server's upload folder</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'bg-indigo-50 border-indigo-400'
            : 'bg-white border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(): void => inputRef.current?.click()}
      >
        <div className="text-5xl mb-4">📄</div>
        <div className="text-gray-900 font-medium mb-3">Drag and drop your files</div>
        <button
          type="button"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          onClick={(event: MouseEvent<HTMLButtonElement>): void => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Select files
        </button>
        <input ref={inputRef} type="file" multiple onChange={handleSelect} className="hidden" />
      </div>

      {queue.items.length > 0 && (
        <>
          <h2 className="mt-6 mb-3 text-base font-semibold text-gray-900">Uploaded Files</h2>
          <ul className="space-y-2">
            {queue.items.map((item) => (
              <UploadRow key={item.id} item={item} onRemove={queue.remove} />
            ))}
          </ul>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              className="flex-1 bg-white text-gray-700 font-medium py-3 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
              onClick={queue.clear}
            >
              {queue.busy ? 'Cancel' : 'Clear'}
            </button>
            <button
              type="button"
              className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={queue.start}
              disabled={!hasPending}
            >
              {queue.busy && !hasPending ? 'Uploading...' : 'Upload files'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
