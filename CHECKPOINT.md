# Checkpoint

Last audited: 2026-11-04
Repository: https://github.com/Yoganataa/openchamber-miniapp
Default branch: main
Working branch: feat/upstream-openchamber-mobile-ui
Open PR: https://github.com/Yoganataa/openchamber-miniapp/pull/1 (draft)

## Current state

- The root app uses the official OpenChamber mobile browser entry from the recursive `vendor/openchamber` submodule.
- Upstream pin: `1e74724fc04026e3666f0802a6040f0f24c74226`, OpenChamber 2.6.0. Upstream source remains untouched.
- Root Vite app loads `packages/web/src/mobile-main.tsx`, which creates the official browser RuntimeAPIs and renders the upstream mobile UI.
- `src/main.tsx` initializes Telegram lifecycle/viewport/theme and marks this host as a pairing-first Mini App. It does not hardcode an OpenChamber server URL.
- The local guarded Vite bridge keeps Telegram BackButton aligned with upstream navigation and exposes upstream pairing-v2 onboarding to the browser host. It fails the build when its upstream source markers no longer match.
- The upstream native QR scanner requires a Capacitor plugin. Telegram Mini App uses the browser runtime, so the current build presents the manual field and accepts a copied `openchamber://connect?...` one-time pairing link. A browser camera scanner remains outstanding.
- Choose **Anywhere** in OpenChamber's Add a device flow to include the official Private Relay transport. The Mini App uses the upstream pairing redemption and E2E relay implementation; it does not need a separately hosted OpenChamber API or custom relay.
- TGCloud static hosting is configured to publish Vite `dist/` at the root. TGCloud backend modules remain optional and scoped under `tgcloud/`.
- The deploy workflow targets GitHub Environment `production`, maps `secrets.ACCESS_TOKEN` to CLI variable `TGCLOUD_TOKEN`, then pushes `dist/` and `tgcloud/` using targeted commands without `--force` or database migrations.
- Environment `production` and secret `ACCESS_TOKEN` were shown by the user; allowed deployment branch is `main`. Secret values are not inspected.
- Browser upstream persistence stores the issued client token in Telegram WebView local storage, unlike native app Keychain/Keystore. Revoke the paired device from the OpenChamber host when it should no longer have access.
- Previous passing build: run 41767263134 on commit 8312d1d, before TGCloud static hosting and pairing-first browser changes. It is not verification of the current implementation.
- Current PR #1 remains draft and unmerged. The new root-build CI must pass before merging and triggering TGCloud deployment.
- Earlier npm install reported 10 dependency audit findings (5 low, 4 high, 1 critical). Review advisories before release; do not run `npm audit fix --force`.

## Active phase

Phase 2 — Telegram pairing and remote runtime verification. Official UI adoption is implemented. The TGCloud root-hosting and browser pairing changes are in PR #1; current-head CI and the first live deployment have not yet been verified.

## Completed implementation

- React + TypeScript + Vite host scaffold with Node.js 24.14+ and npm only.
- Pinned recursive OpenChamber mobile UI submodule, upstream browser entry, styles, fonts, assets and runtime.
- Root-level Telegram lifecycle, viewport/theme bridge, safe-area styles and BackButton integration.
- Guarded local Vite transforms that expose upstream pairing-v2 onboarding in the browser host without editing upstream source.
- TGCloud static config for root-level `dist/` output.
- Deployment script and GitHub Actions workflow for static Mini App plus scoped `tgcloud/` modules, using Environment secret `ACCESS_TOKEN`.
- No echo handler, bot message handler, custom API proxy, new relay or automated database migration.

## Remaining work

1. Verify current PR CI: `npm ci`, host typecheck and root-path production Vite build.
2. Merge PR #1 after CI passes, then verify the production TGCloud workflow and capture the exact static URL printed by the CLI.
3. Register that exact URL as the bot's Main Mini App URL in BotFather; optionally set the menu button to the same URL.
4. On the OpenChamber host, create a new device pairing with **Anywhere**. Open the Telegram Mini App and paste the complete one-time `openchamber://connect?...` link into the manual connection field.
5. Verify pairing redemption, Private Relay connection, sessions, chat streaming, cancellation/reconnect, files, diffs and WebSocket-backed features.
6. Verify BackButton, theme, viewport, safe area and keyboard behavior in Telegram Android, iOS, Desktop and Telegram Web.
7. Consider browser camera QR scanning separately; do not claim it is supported by the current browser build.
8. Review npm audit advisories, performance, accessibility and release/rollback procedures.

## Architecture and security boundaries

- UI source of truth is pinned upstream MobileApp/renderMobileApp, not desktop App.tsx and not a locally recreated interface.
- OpenChamber Server remains on the user's machine and retains responsibility for sessions, OpenCode lifecycle, tools, filesystem and Git.
- TGCloud serves the static Mini App and optional Telegram Serverless modules. It does not host or replace OpenChamber Server.
- Official pairing-v2 establishes the client identity. Choose Anywhere to allow the upstream E2E Private Relay transport when direct connectivity is unavailable.
- The relay is a transport only; it does not grant authorization by itself. The host still authenticates each request.
- Do not put server URLs with permanent credentials, client tokens, bot tokens or CLI tokens into frontend code or `VITE_*` variables.
- Browser-mode client token persistence uses WebView local storage; revocation is performed at the OpenChamber host.
- The upstream monorepo uses Bun, but this project must remain Node.js + npm only. Do not add a Bun lockfile or second package manager.
- `npm run typecheck` checks local host glue; `npm run build` bundles the full pinned upstream renderer.
- `npm run deploy` builds, fetches TGCloud state, then pushes `dist/` and `tgcloud/` separately. Never use `--force`; database migrations remain manual.
- GitHub Actions deployment only runs on `main` and consumes GitHub Environment `production` secret `ACCESS_TOKEN`, mapped to `TGCLOUD_TOKEN`.
- `.tgcloud/` remains ignored local CLI state. Never inspect, expose or commit its credentials.

## Working rules

- Read this file before ROADMAP.md on every continuation.
- Audit current repository, PR and CI before each continuation.
- Use Node.js and npm only; use `npm ci` for reproducible installs.
- Never edit files inside `vendor/openchamber` or recreate existing upstream UI locally.
- Never claim pairing, CI, deployment or live compatibility until each has been verified.
- Update this file and ROADMAP.md whenever phase status or a material decision changes.
