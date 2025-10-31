const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static('public'));

app.post('/api/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  const fileNames = req.files.map(file => file.filename);
  res.json({ 
    success: true, 
    message: `${req.files.length} file(s) uploaded successfully`,
    files: fileNames
  });
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = require('os').networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  
  console.log(`Server running on:`);
  console.log(`  Local:   http://localhost:${PORT}/upload`);
  
  if (addresses.length > 0) {
    const networkUrl = `http://${addresses[0]}:${PORT}/upload`;
    console.log(`  Network: ${networkUrl}\n`);
    console.log('Scan QR code with your mobile device:\n');
    qrcode.generate(networkUrl, { small: true });
  } else {
    console.log('  Network: No network interface found');
  }
});
