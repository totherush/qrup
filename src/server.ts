import fs from 'node:fs';
import os from 'node:os';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import qrcode from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static(path.join(__dirname, 'client')));

app.post('/api/upload', upload.array('files'), (req, res) => {
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

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
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
