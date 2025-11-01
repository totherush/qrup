import fs from 'node:fs';
import os from 'node:os';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import multer, { type StorageEngine } from 'multer';
import qrcode from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse CLI arguments
const args = process.argv.slice(2);
const getArgValue = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : undefined;
};

const app = express();
const PORT = Number.parseInt(
  getArgValue('--port') || getArgValue('-p') || process.env.PORT || '3000',
  10,
);

// Determine the correct base directory (works in both dev and prod)
const baseDir = __dirname.endsWith('dist')
  ? path.join(__dirname, '..')
  : path.join(__dirname, '..');
const clientDir = path.join(baseDir, 'dist', 'client');
const uploadFolder =
  getArgValue('--upload') || getArgValue('-u') || process.env.UPLOAD_FOLDER || 'uploads';
const uploadDir = path.isAbsolute(uploadFolder) ? uploadFolder : path.join(baseDir, uploadFolder);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const filePath = path.join(uploadDir, file.originalname);
    if (fs.existsSync(filePath)) {
      cb(new Error(`File '${file.originalname}' already exists`), '');
    } else {
      cb(null, file.originalname);
    }
  },
});

const upload = multer({ storage: storage });

const USE_COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const C = {
  reset: USE_COLOR ? '\x1b[0m' : '',
  dim: USE_COLOR ? '\x1b[2m' : '',
  red: USE_COLOR ? '\x1b[31m' : '',
  green: USE_COLOR ? '\x1b[32m' : '',
  cyan: USE_COLOR ? '\x1b[36m' : '',
};

function formatTimestamp(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function padCell(s: string, width: number) {
  if (s.length > width) return s.slice(0, width);
  return s.padEnd(width, ' ');
}

function colorAction(action: string, padded: string) {
  switch (action) {
    case 'UPLOAD':
      return `${C.green}${padded}${C.reset}`;
    case 'DOWNLOAD':
      return `${C.cyan}${padded}${C.reset}`;
    case 'DELETE':
      return `${C.red}${padded}${C.reset}`;
    default:
      return padded;
  }
}

function logAction(ip: string, action: string, filename: string) {
  const ts = `${C.dim}${formatTimestamp()}${C.reset}`;
  const level = padCell('INFO', 5);
  const ipClean = (ip || 'unknown').replace('::ffff:', '');
  const ipCell = padCell(ipClean, 21);
  const actionCellPlain = padCell(action, 9);
  const actionCell = colorAction(action, actionCellPlain);
  const fileCell = `"${filename}"`;

  console.info(`${ts} ${level} ${ipCell} ${actionCell} ${fileCell}`);
}

app.use(cors());
app.use(express.static(clientDir));

app.post('/api/upload', (req: Request, res: Response) => {
  upload.array('files')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const fileNames = req.files.map((file) => file.filename);

    for (const file of req.files) {
      logAction(clientIp, 'UPLOAD', file.filename);
    }

    res.json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      files: fileNames,
    });
  });
});

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

function buildFileTree(dirPath: string, basePath = ''): FileNode[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    console.warn(`Skipping directory due to permission error: ${dirPath}`);
    return [];
  }

  const nodes: FileNode[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(basePath, entry.name);

    try {
      if (entry.isDirectory()) {
        const children = buildFileTree(fullPath, relativePath);
        nodes.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children,
        });
      } else {
        const stats = fs.statSync(fullPath);
        nodes.push({
          name: entry.name,
          type: 'file',
          path: relativePath,
          size: stats.size,
        });
      }
    } catch {
      console.warn(`Skipping ${fullPath} due to permission error`);
    }
  }

  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

app.get('/api/files', (_req: Request, res: Response) => {
  try {
    const fileTree = buildFileTree(uploadDir);
    res.json({ files: fileTree });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

app.delete('/api/upload/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!filePath.startsWith(path.resolve(uploadDir))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      logAction(clientIp, 'DELETE', filename);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/download', (req: Request, res: Response) => {
  try {
    const files = req.query.files;

    if (!files) {
      return res.status(400).json({ error: 'No files specified' });
    }

    const filePaths = Array.isArray(files) ? files : [files];

    if (filePaths.length === 0) {
      return res.status(400).json({ error: 'No files specified' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (filePaths.length === 1) {
      const relativePath = filePaths[0] as string;
      const filePath = path.resolve(uploadDir, relativePath);

      if (!filePath.startsWith(path.resolve(uploadDir))) {
        console.error('Path traversal attempt:', filePath);
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return res.status(404).json({ error: 'File not found' });
      }

      const fileName = path.basename(filePath);
      logAction(clientIp, 'DOWNLOAD', fileName);
      return res.download(filePath, fileName);
    } else {
      console.log('Creating ZIP archive for multiple files');
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        throw err;
      });

      res.attachment('files.zip');
      archive.pipe(res);

      let fileCount = 0;
      for (const file of filePaths) {
        const relativePath = file as string;
        const filePath = path.resolve(uploadDir, relativePath);

        if (!filePath.startsWith(path.resolve(uploadDir))) {
          console.warn('Skipping file due to path traversal:', filePath);
          continue;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          console.log('Adding to archive:', relativePath);
          archive.file(filePath, { name: relativePath });
          fileCount++;
        } else {
          console.warn('File not found or not a file:', filePath);
        }
      }

      console.log(`Finalizing archive with ${fileCount} files`);
      logAction(clientIp, 'DOWNLOAD', `files.zip (${fileCount} files)`);
      archive.finalize();
    }
  } catch (error) {
    console.error('Error downloading files:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download files' });
    }
  }
});

app.get('/*splat', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(networkInterfaces)) {
    const nets = networkInterfaces[name];
    if (nets) {
      for (const net of nets) {
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }
  }

  console.log(`Server running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);

  if (addresses.length > 0) {
    const networkUrl = `http://${addresses[0]}:${PORT}`;
    console.log(`  Network: ${networkUrl}`);
  } else {
    console.log('  Network: No network interface found');
  }

  console.log(`\nUpload folder: ${uploadDir}\n`);

  if (addresses.length > 0) {
    const networkUrl = `http://${addresses[0]}:${PORT}`;
    console.log('Scan QR code with your mobile device:\n');
    qrcode.generate(networkUrl, { small: true });
    console.log('\nActivity log:');
  }
});
