# Changelog


## v0.2.2

[compare changes](https://github.com/totherush/qrup/compare/v0.2.1...v0.2.2)

### 🚀 Enhancements

- **cli:** Add --help and --version ([b786fb2](https://github.com/totherush/qrup/commit/b786fb2))
- ⚠️  Require an access token from the QR code by default ([e8dd57a](https://github.com/totherush/qrup/commit/e8dd57a))

### 📖 Documentation

- **readme:** Lead with the one-line install and refresh screenshots ([51cc983](https://github.com/totherush/qrup/commit/51cc983))
- Add contributing guide, security policy and bug report template ([c842220](https://github.com/totherush/qrup/commit/c842220))
- Show the access token in the address and terminal screenshot ([fa574e0](https://github.com/totherush/qrup/commit/fa574e0))

#### ⚠️ Breaking Changes

- ⚠️  Require an access token from the QR code by default ([e8dd57a](https://github.com/totherush/qrup/commit/e8dd57a))

### ❤️ Contributors

- Tobias Trusch <tobiastrusch@gmail.com>

## v0.2.1

[compare changes](https://github.com/totherush/qrup/compare/v0.2.0...v0.2.1)

### 🚀 Enhancements

- Compile standalone binaries and attach them to releases ([299b98f](https://github.com/totherush/qrup/commit/299b98f))

### 📖 Documentation

- Add agent guide and ignore local PLAN.md ([7f22952](https://github.com/totherush/qrup/commit/7f22952))
- Describe binary install and the release workflow ([8847141](https://github.com/totherush/qrup/commit/8847141))

### ✅ Tests

- **e2e:** Use a separate port and upload folder ([c1d958b](https://github.com/totherush/qrup/commit/c1d958b))

### 🤖 CI

- **release:** Build both macOS binaries in one job ([87e4205](https://github.com/totherush/qrup/commit/87e4205))

### ❤️ Contributors

- Tobias Trusch <tobiastrusch@gmail.com>

## v0.2.0

[compare changes](https://github.com/totherush/qrup/compare/v0.1.8...v0.2.0)

### 🩹 Fixes

- **client:** Make file selection work over plain HTTP on phones ([ec02384](https://github.com/totherush/qrup/commit/ec02384))

### 💅 Refactors

- ⚠️  Restructure into server, client and shared modules; upgrade dependencies ([95175b1](https://github.com/totherush/qrup/commit/95175b1))

### 📖 Documentation

- Document project structure and Bun-only setup; run type-check in CI ([d6758fc](https://github.com/totherush/qrup/commit/d6758fc))

### 🏡 Chore

- Remove unused legacy public/index.html ([6696bbb](https://github.com/totherush/qrup/commit/6696bbb))
- Upgrade development tooling to Node 24 ([2d961d8](https://github.com/totherush/qrup/commit/2d961d8))

#### ⚠️ Breaking Changes

- ⚠️  Restructure into server, client and shared modules; upgrade dependencies ([95175b1](https://github.com/totherush/qrup/commit/95175b1))

### ❤️ Contributors

- Tobias Trusch <tobiastrusch@gmail.com>

## v0.1.8

[compare changes](https://github.com/totherush/qrup/compare/v0.1.7...v0.1.8)

### 🩹 Fixes

- **ui:** Handle permission errors and improve folder selection ([c8b15bd](https://github.com/totherush/qrup/commit/c8b15bd))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.7

[compare changes](https://github.com/totherush/qrup/compare/v0.1.6...v0.1.7)

### 🩹 Fixes

- **deps:** Add missing archiver dependency ([737b53d](https://github.com/totherush/qrup/commit/737b53d))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.6

[compare changes](https://github.com/totherush/qrup/compare/v0.1.5...v0.1.6)

## v0.1.5

[compare changes](https://github.com/totherush/qrup/compare/v0.1.4...v0.1.5)

### 🚀 Enhancements

- **cli:** Add port and upload folder CLI arguments ([11f3480](https://github.com/totherush/qrup/commit/11f3480))

### 📖 Documentation

- **readme:** Add homebrew installation instructions ([13d08f3](https://github.com/totherush/qrup/commit/13d08f3))

### ❤️ Contributors

- Tobi <tobiastrusch@gmail.com>

## v0.1.4

[compare changes](https://github.com/totherush/qrup/compare/v0.1.3...v0.1.4)

### 🚀 Enhancements

- **server:** Display upload folder path on startup ([a0e4abc](https://github.com/totherush/qrup/commit/a0e4abc))

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
- **release:** V0.1.1 ([d031740](https://github.com/totherush/qrup/commit/d031740))

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

