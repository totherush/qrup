import { useRef, useState } from 'react';
import FileBrowser from './FileBrowser';

interface FileWithProgress {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  timeLeft?: string;
}

export default function App() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const filesWithProgress: FileWithProgress[] = droppedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      timeLeft: undefined,
    }));
    setFiles((prev) => [...prev, ...filesWithProgress]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const filesWithProgress: FileWithProgress[] = selectedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      timeLeft: undefined,
    }));
    setFiles((prev) => [...prev, ...filesWithProgress]);
    e.target.value = '';
  };

  const uploadFile = (fileObj: FileWithProgress, index: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('files', fileObj.file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, progress, status: 'uploading' as const } : f,
            ),
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, progress: 100, status: 'success' as const } : f,
            ),
          );
          resolve(JSON.parse(xhr.response));
        } else {
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: 'error' as const } : f)),
          );
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: 'error' as const } : f)),
        );
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        if (files[i].status === 'pending') {
          await uploadFile(files[i], i);
        }
      }
      setRefreshTrigger((prev) => prev + 1);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Upload Files</h1>
              <p className="text-sm text-gray-500">Uploaded project attachments</p>
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
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-5xl mb-4">📄</div>
              <div className="text-gray-900 font-medium mb-1">Drag and drop your files</div>
              <button
                type="button"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <>
                <div className="mt-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Uploaded Files</h2>
                  <div className="space-y-2">
                    {files.map((fileObj, index) => (
                      <div
                        key={fileObj.id}
                        className="bg-white border border-gray-200 p-4 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {fileObj.file.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatFileSize(fileObj.file.size)} | {fileObj.progress}%
                              {fileObj.status === 'uploading' &&
                                fileObj.timeLeft &&
                                ` • ${fileObj.timeLeft} sec left`}
                              {fileObj.status === 'success' && ' • Upload Successful'}
                              {fileObj.status === 'error' && ' • Upload failed'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Remove file"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              fileObj.status === 'success'
                                ? 'bg-green-500'
                                : fileObj.status === 'error'
                                  ? 'bg-red-500'
                                  : 'bg-indigo-600'
                            }`}
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    className="flex-1 bg-white text-gray-700 font-medium py-3 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload files'}
                  </button>
                </div>
              </>
            )}
          </div>
          <FileBrowser refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
