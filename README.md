# QRUp

Simple file upload page for local network use. Upload files from your mobile device to the server.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Access the upload page:
   - On the same device: http://localhost:3000/upload
   - From mobile device: http://YOUR_LOCAL_IP:3000/upload
   
The server will display the network URL when started.

## Usage

- Drag and drop files onto the upload area
- Or click to select files from your device
- Files are saved to the `uploads` folder
- Works on mobile devices via local network

## Requirements

- Node.js installed on the server machine
- Both devices on the same local network
