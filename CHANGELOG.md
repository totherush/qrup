# Changelog


## v0.2.2

[compare changes](https://github.com/totherush/qrup/compare/v0.2.1...v0.2.2)

### 🚀 Enhancements

- **cli:** Add --help and --version ([cd7fc55](https://github.com/totherush/qrup/commit/cd7fc55))
- ⚠️  Require an access token from the QR code by default ([09d0cef](https://github.com/totherush/qrup/commit/09d0cef))

### 📖 Documentation

- **readme:** Lead with the one-line install and refresh screenshots ([69d2216](https://github.com/totherush/qrup/commit/69d2216))
- Add contributing guide, security policy and bug report template ([a394e3c](https://github.com/totherush/qrup/commit/a394e3c))
- Show the access token in the address and terminal screenshot ([95fe0cc](https://github.com/totherush/qrup/commit/95fe0cc))

#### ⚠️ Breaking Changes

- ⚠️  Require an access token from the QR code by default ([09d0cef](https://github.com/totherush/qrup/commit/09d0cef))

### ❤️ Contributors

- Tobias Trusch <tobiastrusch@gmail.com>

## v0.2.1

[compare changes](https://github.com/totherush/qrup/compare/v0.2.0...v0.2.1)

### 🚀 Enhancements

- Compile standalone binaries and attach them to releases ([86e1c62](https://github.com/totherush/qrup/commit/86e1c62))

### 📖 Documentation

- Add agent guide and ignore local PLAN.md ([8030777](https://github.com/totherush/qrup/commit/8030777))
- Describe binary install and the release workflow ([51efbb8](https://github.com/totherush/qrup/commit/51efbb8))

### ✅ Tests

- **e2e:** Use a separate port and upload folder ([94ec71e](https://github.com/totherush/qrup/commit/94ec71e))

### 🤖 CI

- **release:** Build both macOS binaries in one job ([d3ff4b2](https://github.com/totherush/qrup/commit/d3ff4b2))

### ❤️ Contributors

- Tobias Trusch <tobiastrusch@gmail.com>

## v0.2.0

[compare changes](https://github.com/totherush/qrup/compare/v0.1.8...v0.2.0)

### 🩹 Fixes

- **client:** Make file selection work over plain HTTP on phones ([841c592](https://github.com/totherush/qrup/commit/841c592))

### 💅 Refactors

- ⚠️  Restructure into server, client and shared modules; upgrade dependencies ([0fe2e1e](https://github.com/totherush/qrup/commit/0fe2e1e))

### 📖 Documentation

- Document project structure and Bun-only setup; run type-check in CI ([0fae249](https://github.com/totherush/qrup/commit/0fae249))

### 🏡 Chore

- Remove unused legacy public/index.html ([eadcde3](https://github.com/totherush/qrup/commit/eadcde3))
- Upgrade development tooling to Node 24 ([ee78285](https://github.com/totherush/qrup/commit/ee78285))

#### ⚠️ Breaking Changes

- ⚠️  Restructure into server, client and shared modules; upgrade dependencies ([0fe2e1e](https://github.com/totherush/qrup/commit/0fe2e1e))

### ❤️ Contributors

- Tobias Trusch <tobiastrusch@gmail.com>

## v0.1.8

[compare changes](https://github.com/totherush/qrup/compare/v0.1.7...v0.1.8)

### 🩹 Fixes

- **ui:** Handle permission errors and improve folder selection ([79247f6](https://github.com/totherush/qrup/commit/79247f6))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.7

[compare changes](https://github.com/totherush/qrup/compare/v0.1.6...v0.1.7)

### 🩹 Fixes

- **deps:** Add missing archiver dependency ([4885c30](https://github.com/totherush/qrup/commit/4885c30))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.6

[compare changes](https://github.com/totherush/qrup/compare/v0.1.5...v0.1.6)

## v0.1.5

[compare changes](https://github.com/totherush/qrup/compare/v0.1.4...v0.1.5)

### 🚀 Enhancements

- **cli:** Add port and upload folder CLI arguments ([7d235cd](https://github.com/totherush/qrup/commit/7d235cd))

### 📖 Documentation

- **readme:** Add homebrew installation instructions ([01f4f16](https://github.com/totherush/qrup/commit/01f4f16))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.4

[compare changes](https://github.com/totherush/qrup/compare/v0.1.3...v0.1.4)

### 🚀 Enhancements

- **server:** Display upload folder path on startup ([152aab5](https://github.com/totherush/qrup/commit/152aab5))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.3

[compare changes](https://github.com/totherush/qrup/compare/v0.1.2...v0.1.3)

## v0.1.2


### 🚀 Enhancements

- **ui:** Migrate to React and Tailwind CSS ([cb7a472](https://github.com/totherush/qrup/commit/cb7a472))
- **explorer:** Add file selection and download ([f1eb2e8](https://github.com/totherush/qrup/commit/f1eb2e8))

### 🩹 Fixes

- **api:** Resolve base directory path in production ([c78cabd](https://github.com/totherush/qrup/commit/c78cabd))
- **upload:** Resolve cancelled upload cleanup and test race conditions ([fb6259d](https://github.com/totherush/qrup/commit/fb6259d))
- **ui:** Improve upload UI and file browser interactions ([2c2e067](https://github.com/totherush/qrup/commit/2c2e067))

### 📖 Documentation

- **config:** Add AGENTS.md for command discovery ([3558f3d](https://github.com/totherush/qrup/commit/3558f3d))
- Prepare repository for public release ([1085ae5](https://github.com/totherush/qrup/commit/1085ae5))
- Add screenshots to demonstrate app workflow ([14d0800](https://github.com/totherush/qrup/commit/14d0800))
- **readme:** Reorganize usage instructions ([3b19687](https://github.com/totherush/qrup/commit/3b19687))

### 🏡 Chore

- **config:** Add Biome linter and agent instructions ([61c352c](https://github.com/totherush/qrup/commit/61c352c))
- **config:** Migrate to Bun runtime and improve dev workflow ([0d71786](https://github.com/totherush/qrup/commit/0d71786))
- Remove .agents folder from repository ([f72ec69](https://github.com/totherush/qrup/commit/f72ec69))
- **release:** V0.1.1 ([b327d8d](https://github.com/totherush/qrup/commit/b327d8d))

### ✅ Tests

- **e2e:** Add Playwright E2E tests with CI workflow ([1228d77](https://github.com/totherush/qrup/commit/1228d77))

### 🤖 CI

- **workflow:** Add biome linter to GitHub Actions ([1150654](https://github.com/totherush/qrup/commit/1150654))
- Migrate CI workflow to Bun runtime ([4bf6d6b](https://github.com/totherush/qrup/commit/4bf6d6b))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.1


### 🚀 Enhancements

- **ui:** Migrate to React and Tailwind CSS ([cb7a472](https://github.com/totherush/qrup/commit/cb7a472))
- **explorer:** Add file selection and download ([f1eb2e8](https://github.com/totherush/qrup/commit/f1eb2e8))

### 🩹 Fixes

- **api:** Resolve base directory path in production ([c78cabd](https://github.com/totherush/qrup/commit/c78cabd))
- **upload:** Resolve cancelled upload cleanup and test race conditions ([fb6259d](https://github.com/totherush/qrup/commit/fb6259d))
- **ui:** Improve upload UI and file browser interactions ([2c2e067](https://github.com/totherush/qrup/commit/2c2e067))

### 📖 Documentation

- **config:** Add AGENTS.md for command discovery ([3558f3d](https://github.com/totherush/qrup/commit/3558f3d))
- Prepare repository for public release ([1085ae5](https://github.com/totherush/qrup/commit/1085ae5))
- Add screenshots to demonstrate app workflow ([14d0800](https://github.com/totherush/qrup/commit/14d0800))
- **readme:** Reorganize usage instructions ([3b19687](https://github.com/totherush/qrup/commit/3b19687))

### 🏡 Chore

- **config:** Add Biome linter and agent instructions ([61c352c](https://github.com/totherush/qrup/commit/61c352c))
- **config:** Migrate to Bun runtime and improve dev workflow ([0d71786](https://github.com/totherush/qrup/commit/0d71786))
- Remove .agents folder from repository ([f72ec69](https://github.com/totherush/qrup/commit/f72ec69))

### ✅ Tests

- **e2e:** Add Playwright E2E tests with CI workflow ([1228d77](https://github.com/totherush/qrup/commit/1228d77))

### 🤖 CI

- **workflow:** Add biome linter to GitHub Actions ([1150654](https://github.com/totherush/qrup/commit/1150654))
- Migrate CI workflow to Bun runtime ([4bf6d6b](https://github.com/totherush/qrup/commit/4bf6d6b))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

