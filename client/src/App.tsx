import { useState, useRef } from 'react';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function App() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...filesWithProgress]);
    setMessage(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const filesWithProgress: FileWithProgress[] = selectedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...filesWithProgress]);
    setMessage(null);
  };

  const uploadFile = (fileObj: FileWithProgress, index: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('files', fileObj.file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress, status: 'uploading' as const } : f))
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress: 100, status: 'success' as const } : f))
          );
          resolve(JSON.parse(xhr.response));
        } else {
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: 'error' as const } : f))
          );
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: 'error' as const } : f))
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
    setMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        if (files[i].status === 'pending') {
          await uploadFile(files[i], i);
        }
      }

      setMessage({ type: 'success', text: `${files.length} file(s) uploaded successfully` });

      setTimeout(() => {
        setFiles([]);
        setMessage(null);
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Some files failed to upload' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl p-10 max-w-2xl w-full shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">📤 QRUp</h1>

        <div
          className={`border-4 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? 'bg-purple-100 border-purple-800 scale-105'
              : 'bg-purple-50 border-purple-600 hover:bg-purple-100'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-6xl mb-5">📁</div>
          <div className="text-gray-700 text-lg mb-2">Drag & drop files here</div>
          <div className="text-gray-500 text-sm">or click to select files</div>
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
            <div className="mt-8 space-y-3">
              {files.map((fileObj, index) => (
                <div key={index} className="bg-purple-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-800 text-sm flex-1 truncate">
                      {fileObj.file.name}
                    </span>
                    <span className="text-gray-500 text-xs ml-3">
                      {formatFileSize(fileObj.file.size)}
                    </span>
                    {fileObj.status !== 'pending' && (
                      <span
                        className={`text-xs ml-3 font-bold ${
                          fileObj.status === 'uploading'
                            ? 'text-purple-600'
                            : fileObj.status === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {fileObj.status === 'uploading' && '⏫ Uploading...'}
                        {fileObj.status === 'success' && '✓ Done'}
                        {fileObj.status === 'error' && '✗ Failed'}
                      </span>
                    )}
                  </div>
                  {fileObj.status !== 'pending' && (
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-800 transition-all duration-300 rounded-full"
                        style={{ width: `${fileObj.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-4 rounded-xl text-base mt-5 transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
            </button>
          </>
        )}

        {message && (
          <div
            className={`mt-5 p-4 rounded-xl text-center text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
