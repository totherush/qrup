import fs from 'node:fs';
import os from 'node:os';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import multer, { type StorageEngine } from 'multer';
import qrcode from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);

// Determine the correct base directory (works in both dev and prod)
const baseDir = __dirname.endsWith('dist')
  ? path.join(__dirname, '..')
  : path.join(__dirname, '..');
const clientDir = path.join(baseDir, 'dist', 'client');
const uploadDir = path.join(baseDir, process.env.UPLOAD_FOLDER || 'uploads');

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
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static(clientDir));

app.post('/api/upload', upload.array('files'), (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const fileNames = req.files.map((file) => file.filename);
  res.json({
    success: true,
    message: `${req.files.length} file(s) uploaded successfully`,
    files: fileNames,
  });
});

app.get('*', (_req: Request, res: Response) => {
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
    console.log(`  Network: ${networkUrl}\n`);
    console.log('Scan QR code with your mobile device:\n');
    qrcode.generate(networkUrl, { small: true });
  } else {
    console.log('  Network: No network interface found');
  }
});
