# QRUp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Simple file uploader for local network use. Upload files from your mobile device to the server with QR code scanning for easy access.

> ⚠️ **Security Warning**: This application is designed for LOCAL NETWORK USE ONLY. Do NOT expose this server to the public internet without proper authentication and security measures.

## Table of Contents

- [QRUp](#qrup)
  - [Table of Contents](#table-of-contents)
  - [How It Works](#how-it-works)
    - [1. Start the Server](#1-start-the-server)
    - [2. Access from Desktop](#2-access-from-desktop)
    - [3. Access from Mobile](#3-access-from-mobile)
    - [4. Upload Files](#4-upload-files)
  - [Setup](#setup)
    - [Installation via Homebrew](#installation-via-homebrew)
    - [Manual Setup](#manual-setup)
  - [Requirements](#requirements)
  - [Release Process](#release-process)

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

### Installation via Homebrew

Works on macOS and Linux (Apple Silicon, Intel, x64, arm64). The formula installs a standalone binary, so nothing else is needed.

```bash
brew tap totherush/tap
brew install qrup
```

**Usage:**

```bash
# Start with default settings (port 3000, uploads folder)
qrup

# Specify custom port and upload directory
qrup --port 8080 --upload /path/to/uploads

# Using short flags
qrup -p 8080 -u ./my-uploads
```

**CLI Options:**

- `--port, -p` - Server port (default: 3000)
- `--upload, -u` - Upload directory path, absolute or relative to the current directory (default: `./uploads`)

To update to the latest version:

```bash
brew update
brew upgrade qrup
```

### Manual Setup

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

## Project Structure

```
server/        Express server (Bun runtime)
  index.ts     entry point: config, banner, QR code
  app.ts       wires the API routers and the static client
  routes/      upload + delete, file list + download
  lib/         path safety, file tree, logging, network addresses
client/src/    React app
  api.ts       typed calls to the server API
  hooks/       upload queue (parallel uploads, progress, cancel)
  components/  upload panel, file browser
shared/api.ts  request and response types used by both sides
tests/         Playwright end-to-end tests
```

Development needs Node 24 (see `.nvmrc`) for the build and test tools. Checks: `bun run check` (TypeScript + Biome), `bun run test:e2e` (Playwright).

## Requirements

- Both devices on the same local network
- For the manual setup only: Bun, plus Node 24 for the build and test tools

## Release Process

1. Run the release command on an up-to-date `main`. It type-checks, lints and builds, bumps the version in package.json, updates CHANGELOG.md, and commits and tags the release:

   ```bash
   bun run release
   ```

2. Push the commit and the tag:

   ```bash
   git push origin main --follow-tags
   ```

   The tag starts the release workflow, which compiles the binaries for macOS and Linux and attaches them and `SHA256SUMS` to the GitHub release.
3. Update `Formula/qrup.rb` in [totherush/homebrew-tap](https://github.com/totherush/homebrew-tap) with the new version and the SHA-256 values from `SHA256SUMS`.
