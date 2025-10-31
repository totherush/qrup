# QRUp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Simple file upload page for local network use. Upload files from your mobile device to the server with QR code scanning for easy access.

> ⚠️ **Security Warning**: This application is designed for LOCAL NETWORK USE ONLY. Do NOT expose this server to the public internet without proper authentication and security measures.

## Setup

1. Install dependencies:
```bash
bun install
```

2. (Optional) Configure environment variables:
   - Copy `.env.example` to `.env`
   - Customize `PORT` (default: 3000) and `UPLOAD_FOLDER` (default: uploads)

3. Start the server:
   ```bash
   bun run dev
   ```
   Or for production:
   ```bash
   bun start
   ```

4. Access the upload page:
   - On the same device: http://localhost:3000
   - From mobile device: Scan the QR code displayed in the terminal

## Usage

- Drag and drop files onto the upload area
- Or click to select files from your device
- Files are saved to the `uploads` folder
- Works on mobile devices via local network

## Requirements

- Bun runtime installed on the server machine
- Both devices on the same local network
