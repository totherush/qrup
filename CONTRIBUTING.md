# Contributing to QRUp

Bug reports, ideas, and pull requests are welcome. For a larger change, open an issue first so we can agree on the approach.

## Setup

You need [Bun](https://bun.sh) and Node 24 (see `.nvmrc`; Node runs the build and test tools).

```bash
bun install
bun run dev        # rebuilds the client and restarts the server on changes
```

Open the `Local` address it prints (it includes the access token), or scan the QR code with a phone on the same network. `QRUP_OPEN=1 bun run dev` skips the token while you work.

## Before you open a pull request

```bash
bun run check      # TypeScript and Biome; must pass
bun run test:e2e   # Playwright end-to-end tests; must pass
```

- Biome requires explicit parameter and return types and bans `any`. `bun run lint:fix` fixes formatting and import order.
- Add or update an E2E test in `tests/` when you change behavior.
- The E2E tests use port 3100 and `tmp/e2e-uploads`, so they never touch a qrup you run on port 3000 or its `uploads/` folder.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), such as `fix(client): …` or `feat: …`. The changelog is generated from them.

## Project structure

```
server/                Express server, run by Bun
  index.ts             entry when run from source or dist/server.js
  start.ts             CLI flags, startup, QR code banner
  config.ts            flags, then environment variables, then defaults
  app.ts               mounts the API and serves the client
  routes/              upload and delete; file list and download
  lib/                 path safety, file tree, logging, network addresses
client/src/            React app
  api.ts               typed calls to the server API
  hooks/               upload queue: parallel uploads, progress, cancel
  components/          upload panel, file browser
shared/api.ts          request and response types used by both sides
scripts/build-binary.ts  compiles a standalone binary with the client embedded
tests/                 Playwright end-to-end tests
```

Phones open the page over plain HTTP on a LAN address, which is not a secure context. Browser APIs that need one, such as `crypto.randomUUID()` or `navigator.clipboard`, are missing there. The E2E tests open the app via `http://qrup.test` to catch this.

## Standalone binary

```bash
bun run build:binary                    # dist/qrup for this machine
QRUP_BINARY=dist/qrup bun run test:e2e  # run the E2E tests against it
```
