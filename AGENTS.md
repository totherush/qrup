# QRUp agent guide

QRUp serves a local web page for moving files between a phone and a computer on the same network. See README.md for usage and CONTRIBUTING.md for the project structure.

Planned work lives in `PLAN.md`, a local file that is gitignored and only exists in the maintainer's checkout. When it is present, read it before starting, and update it when you finish or discover work.

## Commands

- `bun run check`: TypeScript and Biome. Run it before every commit.
- `bun run test:e2e`: Playwright end-to-end tests. The test server uses port 3100 and `tmp/e2e-uploads`, never port 3000 or `uploads/`. `QRUP_BINARY=dist/qrup bun run test:e2e` runs them against a compiled binary.
- `bun run build:binary`: compiles `dist/qrup`, a standalone executable with the client embedded.
- `bun run start`: builds and starts the server on port 3000.

## Conventions

- Explicit parameter and return types everywhere; Biome enforces this and bans `any`.
- Request and response types shared by the server and the client live in `shared/api.ts`.
- Commit messages use Conventional Commits (`feat(scope): …`, `fix(scope): …`); changelogen builds CHANGELOG.md from them.
- Releases: `bun run release`, push `main` and the tag, then update `Formula/qrup.rb` in the sibling `../homebrew-tap` repo with the new tarball URL and SHA-256.

## Pitfalls

- Every `/api` request needs the access token (`x-qrup-token` header, or `?t=` for download links) unless qrup runs with `--open`. The E2E server uses the fixed token `e2e-test-token` from `QRUP_TOKEN`; open pages with `startUrl` from `tests/helpers.ts`.

- Phones open the app over plain HTTP on a LAN address, which is not a secure context. Browser APIs that need one, such as `crypto.randomUUID()` or `navigator.clipboard`, are missing there. The E2E tests open the app via `http://qrup.test` for this reason; keep it that way.
- `uploads/` may hold the user's real files when they run the server from this folder. Never delete or empty it, and keep the E2E tests on their own folder and port.
