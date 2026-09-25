#!/usr/bin/env bash
set -euo pipefail
root=$(git rev-parse --show-toplevel)
cd "$root"
[[ -z $(git status --porcelain) ]] || { echo 'Commit reviewed changes before packaging.' >&2; exit 1; }
git merge-base --is-ancestor 9b8c1d3457b00359af206e3fd423fe50520182c2 HEAD
output=${1:?Provide a new output directory}
[[ ! -e "$output" ]] || { echo 'Output already exists.' >&2; exit 1; }
mkdir -p "$output"
output=$(cd "$output" && pwd)
pnpm exec turbo run build --filter=bb-app
node --input-type=module - "$output" <<'NODE'
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const output = process.argv[2];
const pkg = JSON.parse(fs.readFileSync('packages/bb-app/package.json', 'utf8'));
if (pkg.version !== '0.43.4') throw new Error('Reaudit compatibility before changing the base version');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
fs.writeFileSync(`${output}/fork-build.json`, JSON.stringify({ upstream: '9b8c1d3457b00359af206e3fd423fe50520182c2', commit, compatibilityVersion: pkg.version, builtAt: new Date().toISOString(), platform: 'portable-js-linux-native-dependencies-required' }, null, 2) + '\n');
NODE
COPYFILE_DISABLE=1 tar -czf "$output/bb-app-portable.tar.gz" -C packages/bb-app package.json dist app host-daemon server
(cd "$output" && shasum -a 256 bb-app-portable.tar.gz fork-build.json > SHA256SUMS)
