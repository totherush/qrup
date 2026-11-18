# QRUp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Move files between your phone and your computer over Wi-Fi. Run `qrup`, scan the QR code, and use the page that opens on your phone. No app, no account, no cloud: files stay on your network.

```bash
brew install totherush/tap/qrup
qrup
```

> ⚠️ **Local network only.** Anyone on the same network who opens the page can list, download, and delete files in the upload folder. Do not expose qrup to the internet.

## How it works

1. **Start qrup** in a terminal. It prints the local network address and a QR code:

   <img src=".github/screenshots/qr-terminal.png" alt="Terminal with QR code" width="600">

2. **Scan the QR code** with your phone's camera. The upload page opens in the phone's browser:

   <img src=".github/screenshots/mobile-browser.png" alt="qrup on a phone" width="300">

3. **Send files** either way:
   - From the phone: select photos, videos, or other files. Up to three upload at a time, and each shows its progress.
   - To the phone: tick files in the file browser and tap Download. Several files or a folder arrive as one ZIP.

   The same page works in a desktop browser, with drag and drop:

   <img src=".github/screenshots/desktop-browser.png" alt="qrup in a desktop browser" width="600">

Uploads are saved to `./uploads` in the folder you start qrup from. A file whose name already exists is saved as `name (1).ext`, and a cancelled upload leaves nothing behind.

## Install

### Homebrew (macOS and Linux)

```bash
brew install totherush/tap/qrup
```

This installs a standalone binary for Apple Silicon, Intel, Linux x64, or Linux arm64, with nothing else to install. Update with `brew upgrade qrup`.

### Prebuilt binary

Download `qrup-<platform>.tar.gz` from the [latest release](https://github.com/totherush/qrup/releases/latest), unpack it, and run `./qrup`. Checksums are in `SHA256SUMS`.

## Usage

```bash
qrup                          # port 3000, saves to ./uploads
qrup -p 8080 -u ~/Downloads   # custom port and upload folder
qrup --help                   # all options
```

| Option            | Environment variable | Default     |                                                              |
| ----------------- | -------------------- | ----------- | ------------------------------------------------------------ |
| `-p`, `--port`    | `PORT`               | `3000`      | Port to listen on                                            |
| `-u`, `--upload`  | `UPLOAD_FOLDER`      | `./uploads` | Upload folder, absolute or relative to the current directory |
| `-v`, `--version` |                      |             | Print the version                                            |
| `-h`, `--help`    |                      |             | Print the help                                               |

The first time it runs, macOS may ask whether qrup may accept incoming network connections. Allow it, or your phone cannot reach the page.

## Development

Requires [Bun](https://bun.sh) and Node 24 (see `.nvmrc`) for the build and test tools.

```bash
bun install
bun run dev        # rebuilds the client and restarts the server on changes
bun run check      # TypeScript and Biome
bun run test:e2e   # Playwright end-to-end tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the project structure and how to submit changes.

### Release process

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
