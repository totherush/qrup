# QRUp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Simple file uploader for local network use. Upload files from your mobile device to the server with QR code scanning for easy access.

> ⚠️ **Security Warning**: This application is designed for LOCAL NETWORK USE ONLY. Do NOT expose this server to the public internet without proper authentication and security measures.

## Table of Contents

- [How It Works](#how-it-works)
  - [1. Start the Server](#1-start-the-server)
  - [2. Access from Desktop](#2-access-from-desktop)
  - [3. Access from Mobile](#3-access-from-mobile)
  - [4. Upload Files](#4-upload-files)
- [Setup](#setup)
- [Requirements](#requirements)

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

### 4. Upload Files
- Drag and drop files onto the upload area
- Or click to select files from your device
- Files are saved to the `uploads` folder
- Works seamlessly on both desktop and mobile devices

## Setup

1. Install dependencies:
```bash
bun install
```

2. (Optional) Configure environment variables:
   - Copy `.env.example` to `.env`
   - Available environment variables:
     - `PORT` - Server port (default: 3000)
     - `UPLOAD_FOLDER` - Upload directory path (default: uploads)

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

## Requirements

- Node.js 22.18.0 or higher
- Bun runtime installed on the server machine
- Both devices on the same local network
