/**
 * Points the Homebrew formula at a new release: sets `version` and the `sha256` that follows
 * each `qrup-<platform>.tar.gz` URL, taken from the release's SHA256SUMS.
 *
 *   bun scripts/update-formula.ts <path/to/qrup.rb> <version> <path/to/SHA256SUMS>
 *
 * Fails when the formula and SHA256SUMS do not list the same archives, so a new or renamed
 * platform cannot silently keep an old checksum.
 */
import fs from 'node:fs';

const [formulaPath, version, sumsPath] = process.argv.slice(2);
if (!formulaPath || !version || !sumsPath) {
  throw new Error('Usage: bun scripts/update-formula.ts <qrup.rb> <version> <SHA256SUMS>');
}

/** Archive name to SHA-256, from lines such as `abc123…  qrup-darwin-arm64.tar.gz`. */
function readSums(text: string): Map<string, string> {
  const sums = new Map<string, string>();
  for (const line of text.split('\n')) {
    const match = /^([0-9a-f]{64})\s+\*?(\S+\.tar\.gz)$/.exec(line.trim());
    if (match?.[1] && match[2]) sums.set(match[2], match[1]);
  }
  return sums;
}

const sums = readSums(fs.readFileSync(sumsPath, 'utf8'));
const lines = fs.readFileSync(formulaPath, 'utf8').split('\n');
const updated = new Set<string>();
let currentArchive: string | undefined;

const output = lines.map((line: string): string => {
  if (/^\s*version "[^"]*"$/.test(line)) return line.replace(/"[^"]*"/, `"${version}"`);

  const url = /url ".*\/(qrup-[\w-]+\.tar\.gz)"/.exec(line);
  if (url?.[1]) {
    currentArchive = url[1];
    return line;
  }

  if (currentArchive && /^\s*sha256 "[0-9a-f]+"$/.test(line)) {
    const sha = sums.get(currentArchive);
    if (!sha) throw new Error(`SHA256SUMS has no entry for ${currentArchive}`);
    updated.add(currentArchive);
    currentArchive = undefined;
    return line.replace(/"[0-9a-f]+"/, `"${sha}"`);
  }
  return line;
});

const missing = [...sums.keys()].filter((archive: string): boolean => !updated.has(archive));
if (updated.size === 0 || missing.length > 0) {
  throw new Error(`Formula does not reference: ${missing.join(', ') || 'any archive'}`);
}
fs.writeFileSync(formulaPath, output.join('\n'));
console.log(`Updated ${formulaPath} to ${version} (${updated.size} archives)`);
