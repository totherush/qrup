# QRUp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Simple file upload page for local network use. Upload files from your mobile device to the server with QR code scanning for easy access.

> ⚠️ **Security Warning**: This application is designed for LOCAL NETWORK USE ONLY. Do NOT expose this server to the public internet without proper authentication and security measures.

## How It Works

### 1. Start the Server
When you run the application, a QR code is displayed in your terminal along with the local network URL:

<img src=".github/screenshots/qr-terminal.png" alt="Terminal with QR code" width="600">

### 2. Access from Desktop
Open the URL in your desktop browser to upload files locally:

<img src=".github/screenshots/desktop-browser.png" alt="Desktop browser upload interface" width="600">

### 3. Access from Mobile
Scan the QR code with your mobile device to instantly access the upload page:

<img src=".github/screenshots/mobile-browser.png" alt="Mobile browser upload interface" width="300">

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
