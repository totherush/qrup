import { type JSX, useCallback, useState } from 'react';
import { FileBrowser } from './components/FileBrowser';
import { UploadPanel } from './components/UploadPanel';

export function App(): JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback((): void => setRefreshKey((key) => key + 1), []);

  return (
    <main className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UploadPanel onFilesChanged={refresh} />
        <FileBrowser refreshKey={refreshKey} />
      </div>
    </main>
  );
}
