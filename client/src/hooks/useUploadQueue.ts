import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteUploadedFile, UploadAbortedError, type UploadRequest, uploadFile } from '../api';

/** How many files upload at the same time. */
const CONCURRENCY = 3;

// Not crypto.randomUUID(): phones open the app over plain HTTP on a LAN address,
// which is not a secure context, so that API is missing there.
let lastId = 0;
const nextId = (): string => String(++lastId);

/**
 * `pending`: added, waiting for the user to start. `queued`: started, waiting for a free slot.
 */
export type UploadStatus = 'pending' | 'queued' | 'uploading' | 'success' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  /** 0 to 100. */
  progress: number;
  secondsLeft?: number;
  /** Name the server saved the file under; differs from `file.name` on conflicts. */
  savedAs?: string;
  error?: string;
}

export interface UploadQueue {
  items: UploadItem[];
  /** True while any file is queued or uploading. */
  busy: boolean;
  add: (files: readonly File[]) => void;
  /** Queues every pending file. */
  start: () => void;
  /** Removes an item: aborts it while uploading, and deletes it from the server once uploaded. */
  remove: (id: string) => void;
  /** Aborts all uploads and empties the list. Files already uploaded stay on the server. */
  clear: () => void;
}

/** Upload list state plus a scheduler that keeps up to `CONCURRENCY` uploads running. */
export function useUploadQueue(onUploaded: () => void): UploadQueue {
  const [items, setItems] = useState<UploadItem[]>([]);
  const requests = useRef(new Map<string, UploadRequest>());

  const update = useCallback((id: string, changes: Partial<UploadItem>): void => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }, []);

  const run = useCallback(
    (item: UploadItem): void => {
      const startedAt = performance.now();
      const request = uploadFile(item.file, (fraction: number): void => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const secondsLeft = fraction > 0 ? (elapsed / fraction) * (1 - fraction) : undefined;
        update(item.id, { progress: Math.round(fraction * 100), secondsLeft });
      });
      requests.current.set(item.id, request);
      update(item.id, { status: 'uploading' });

      // Free the slot before the state update, which re-runs the scheduler.
      request.done.then(
        (savedAs: string): void => {
          requests.current.delete(item.id);
          update(item.id, { status: 'success', progress: 100, savedAs });
          onUploaded();
        },
        (error: unknown): void => {
          // An aborted item was already removed from the list and its slot freed.
          if (error instanceof UploadAbortedError) return;
          requests.current.delete(item.id);
          update(item.id, { status: 'error', error: (error as Error).message });
        },
      );
    },
    [onUploaded, update],
  );

  // Start queued files whenever a slot is free.
  useEffect((): void => {
    const free = CONCURRENCY - requests.current.size;
    const next = items.filter((item) => item.status === 'queued' && !requests.current.has(item.id));
    for (const item of next.slice(0, Math.max(0, free))) run(item);
  }, [items, run]);

  const busy = items.some((item) => item.status === 'queued' || item.status === 'uploading');

  // Leaving the page would cancel running uploads, so ask first.
  useEffect((): (() => void) | undefined => {
    if (!busy) return undefined;
    const warn = (event: BeforeUnloadEvent): void => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return (): void => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  const add = useCallback((files: readonly File[]): void => {
    const added = files.map(
      (file): UploadItem => ({ id: nextId(), file, status: 'pending', progress: 0 }),
    );
    setItems((prev) => [...prev, ...added]);
  }, []);

  const start = useCallback((): void => {
    setItems((prev) =>
      prev.map((item) => (item.status === 'pending' ? { ...item, status: 'queued' } : item)),
    );
  }, []);

  const remove = useCallback(
    (id: string): void => {
      const item = items.find((candidate) => candidate.id === id);
      setItems((prev) => prev.filter((candidate) => candidate.id !== id));
      requests.current.get(id)?.abort();
      requests.current.delete(id);
      if (item?.status === 'success' && item.savedAs) {
        deleteUploadedFile(item.savedAs)
          .catch((error: unknown): void => console.error('Delete failed:', error))
          .finally(onUploaded);
      }
    },
    [items, onUploaded],
  );

  const clear = useCallback((): void => {
    for (const request of requests.current.values()) request.abort();
    requests.current.clear();
    setItems([]);
  }, []);

  return { items, busy, add, start, remove, clear };
}
