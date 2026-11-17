import type { JSX } from 'react';
import type { UploadItem, UploadStatus } from '../hooks/useUploadQueue';
import { formatBytes, formatSecondsLeft } from '../lib/format';
import { CloseIcon, StopIcon, TrashIcon } from './Icons';

interface UploadRowProps {
  item: UploadItem;
  onRemove: (id: string) => void;
}

/** What the row's button does in each state. Only an uploaded file is deleted from the server. */
const ACTION: Record<UploadStatus, { label: string; icon: () => JSX.Element }> = {
  pending: { label: 'Remove file', icon: CloseIcon },
  queued: { label: 'Remove file', icon: CloseIcon },
  uploading: { label: 'Stop upload', icon: StopIcon },
  success: { label: 'Delete file', icon: TrashIcon },
  error: { label: 'Remove file', icon: CloseIcon },
};

const BAR_COLOR: Record<UploadStatus, string> = {
  pending: 'bg-indigo-600',
  queued: 'bg-indigo-600',
  uploading: 'bg-indigo-600',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

function statusText(item: UploadItem): string {
  switch (item.status) {
    case 'pending':
      return '';
    case 'queued':
      return ' • Waiting…';
    case 'uploading':
      return item.secondsLeft === undefined ? '' : ` • ${formatSecondsLeft(item.secondsLeft)} left`;
    case 'success':
      return item.savedAs && item.savedAs !== item.file.name
        ? ` • Upload Successful, saved as ${item.savedAs}`
        : ' • Upload Successful';
    case 'error':
      return ` • ${item.error ?? 'Upload failed'}`;
  }
}

export function UploadRow({ item, onRemove }: UploadRowProps): JSX.Element {
  const action = ACTION[item.status];
  const Icon = action.icon;
  return (
    <li className="bg-white border border-gray-200 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{item.file.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatBytes(item.file.size)} | {item.progress}%{statusText(item)}
          </div>
        </div>
        <button
          type="button"
          onClick={(): void => onRemove(item.id)}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={action.label}
        >
          <Icon />
        </button>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${BAR_COLOR[item.status]}`}
          style={{ width: `${item.progress}%` }}
        />
      </div>
    </li>
  );
}
