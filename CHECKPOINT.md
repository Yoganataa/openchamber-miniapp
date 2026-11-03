# Checkpoint

Last audited: 2026-11-04
Repository: https://github.com/Yoganataa/openchamber-miniapp
Default branch: main
Working branch: feat/upstream-openchamber-mobile-ui

## Current state
- Base branch main at `c98ea591c5c3eb270eac49dd8d0b79156910f776` when this continuation began.
- No pre-existing open PRs were returned at the start of this continuation.
- This branch pins official upstream source `openchamber/openchamber` at `1e74724fc04026e3666f0802a6040f0f24c74226` in `vendor/openchamber`.
- The upstream source revision is version 2.6.0. It includes the official mobile renderer at `packages/ui/src/apps/renderMobileApp.tsx` and `MobileApp.tsx`, with its browser entry and runtime API adapter under `packages/web/src/`.
- The upstream renderer has **not yet been wired into this repository's Vite entry point**. The app currently still displays the local scaffold. Do not claim UI parity is complete.
- Upstream uses Bun workspaces, but this repository remains Node.js >=24.14.0 + npm only. No Bun commands or lockfiles are added.
- CI checkout now initializes recursive submodules. The existing npm ci, typecheck, and build checks still need a successful workflow run before Phase 0 can be closed.
- No successful local or remote typecheck/build result has been established in this continuation.

## Active phase
Phase 0 — Foundation (CI verification outstanding), with the upstream source pin established as groundwork for Phase 1.

## Completed and present
- React + TypeScript + Vite scaffold.
- Telegram WebApp adapter with browser fallback.
- Initial Telegram ready(), expand(), and color-scheme read.
- Public environment configuration and HTTPS URL validation.
- Responsive shell with CSS safe-area insets.
- Telegram Serverless scaffold: tgcloud.jsonc, tgcloud/handlers/message.js, tgcloud/schema.js, AGENTS.md, and docs/tgcloud-sdk.md.
- npm scripts for development, typecheck, build, and build-then-deploy.
- Official OpenChamber source pinned as a Git submodule at `1e74724fc04026e3666f0802a6040f0f24c74226`.
- Upstream integration boundaries documented in `docs/UPSTREAM-INTEGRATION.md`.
- GitHub Actions checks out recursive submodules and runs npm ci, npm run typecheck, and npm run build.

## Remaining work
1. Verify CI with the submodule checkout change.
2. Wire the official OpenChamber mobile renderer into the Vite entry point using npm-compatible dependency resolution.
3. Reuse the official mobile browser runtime/API adapter; audit authentication and CORS requirements at the pinned upstream revision.
4. Integrate Telegram lifecycle, theme, viewport, and BackButton with the upstream mobile app.
5. Review/replace the Telegram Serverless scaffold echo handler before any production deployment.

## Important implementation notes
- The desired UI source of truth is upstream OpenChamber's mobile renderer, not a local recreation and not its desktop shell.
- The upstream package workspace and lockfile use Bun. Do not run upstream Bun scripts or import its Bun lockfile. Resolve the required source dependencies via this repository's npm manifest and committed npm lockfile.
- Preserve the upstream submodule contents unchanged. Put Telegram-specific integration in this repository.
- `tgcloud.jsonc` publishes Vite's `dist` directory as the Mini App static site.
- Telegram Serverless modules execute in Telegram's isolated runtime, not ordinary Node.js. Only the platform SDK and project modules under `tgcloud/` are available there; do not import frontend code or arbitrary npm packages into those modules.
- `tgcloud/handlers/message.js` is currently the scaffold echo handler. Review/replace it before production deployment.
- OpenChamber Server remains the privileged backend. Telegram identity does not automatically authorize access to an OpenChamber instance.
- Never commit CLI credentials. Any CLI Access Token previously pasted into chat must be treated as compromised and revoked; authenticate only in the user's local CLI prompt with a newly issued token.

## Working rules
- Use Node.js and npm only. Use npm ci for reproducible installs.
- Do not reintroduce Bun or a second lockfile.
- Read this file before ROADMAP.md on every continuation.
- Audit current repository and PR state before each continuation.
- Do not repeat completed work or claim tests/deployment that have not run.
- Update this file and ROADMAP.md whenever phase status or a material implementation decision changes.
- Keep secrets out of chat, source control, logs, and frontend environment variables.
