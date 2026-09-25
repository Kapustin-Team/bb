# Kapustin BB fork

This branch starts at upstream `get-bb/bb` commit `9b8c1d3457b00359af206e3fd423fe50520182c2` (desktop 0.43.4). The BB compatibility version stays 0.43.4. Deployments must additionally record the full fork commit and an image digest; a version number alone does not identify this build.

The initial patch series contains the deployed Lock Area frontend/experimental SDK extension and migration preview mode. Personal plugin sources, credentials, databases, chat history, and backups are private deployment data and must never be committed to this public fork or baked into its image.

## Rehearsal

Set `BB_MIGRATION_PREVIEW=true` on a separate data volume. This disables plugin background services and cron execution, startup recovery, periodic sweeps and automatic catalog/plugin refreshes. Enabled plugin registrations, settings and storage remain available. This is not a security sandbox: plugin initialization and explicit user actions can still execute code.

A rehearsal copy also needs the native `server-connect-hold.json` marker, fresh local daemon identity, and native manual-import boot fixups. Do not run a server move from the live installation. Keep historical remote machines offline until the owner approves enrollment. Linux must use Linux provider runtimes and native modules, never the macOS binaries from a restore archive. Keep the complete macOS archive separately for restoration.

## Updates

1. Take a verified state backup plus an immutable plugin migration checkpoint. Record enabled IDs, source locations, local managed-source diffs, schema and bundle hashes. Keep old image and data volume.
2. Fetch upstream and create an integration branch from the chosen exact release. Port the Lock Area patch and preview patch; audit experimental SDK, UI selectors, stored data and managed-plugin overlays. Never replace a current frontend with an older bundle.
3. Run focused tests and Turbo typechecks/builds. Build outside the production hosting server. Produce a source-commit manifest, checksums and a separate immutable image tag.
4. Restore the backup to a new volume, preserve plugin IDs and data, then use native import path fixups. Keep legacy local source paths compatible or use supported plugin source operations; do not rewrite registration rows manually.
5. Inspect data counts, plugin state, custom screens, Lock Area and proxy egress in preview mode. Confirm production workloads and original machines are unchanged.
6. Activate the new instance only after review. Removing preview mode can start schedules immediately. Rebind machines and switch the main domain only as a separate authorized cutover.

Rollback selects the previous image and its matching untouched data volume. Never run an older version against a database already migrated by a newer release. The main macOS application is not updated by this workflow.

## Build identity

Use `scripts/kapustin-package.sh <output-directory>` from a clean checkout after the relevant tests and typechecks pass. The script builds with Turbo and emits the portable package payload, manifest and SHA-256 sums. Assemble it with Linux runtime dependencies of the matching BB version. Do not run the monorepo build on a shared production server.
