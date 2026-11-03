# Checkpoint

Last audited: 2026-11-04
Repository: https://github.com/Yoganataa/openchamber-miniapp
Default branch: main
Working branch: feat/upstream-openchamber-mobile-ui
Open PR: https://github.com/Yoganataa/openchamber-miniapp/pull/1 (draft)

## Current state
- PR #1 pins official upstream OpenChamber at commit 1e74724fc04026e3666f0802a6040f0f24c74226 (application version 2.6.0) as vendor/openchamber.
- The root app imports upstream packages/web/src/mobile-main.tsx. That entry initializes upstream browser RuntimeAPIs and renders the official renderMobileApp / MobileApp.
- Local Telegram glue initializes the WebApp, provides viewport/theme host state, sets the public OpenChamber API origin, and bridges Telegram BackButton to the upstream handleNativeBack callback through a guarded Vite transform.
- Upstream source inside vendor/openchamber remains unchanged.
- Repository uses Node.js >=24.14.0 + npm only. The upstream dependency package-lock was generated and committed by GitHub Actions at 176dfcafc8b4f8b84b0ec6b14be0715d63bb7ab3.
- Latest integration CI before the worker-format fix: npm ci passed and npm run typecheck passed, but Vite build failed because the diff worker inherited IIFE format while using code splitting.
- Vite worker.format was set to es in commit 982b8a22c715607398f8a22511285a75596c0480. A new green CI run is still required.
- npm ci reported 10 dependency audit findings (5 low, 4 high, 1 critical). Inspect the advisory tree before release; do not run npm audit fix --force.
- Production origin requirement: upstream OpenChamber Server does not allow arbitrary TGCloud static origins. Serve the Mini App on the same scheme/host/port as OpenChamber Server under /miniapp/. TGCloud static hosting is intentionally disabled in tgcloud.jsonc; TGCloud remains for optional backend modules.

## Active phase
Phase 1 — Official mobile UI adoption (renderer and host bridge integrated; full production build and Telegram runtime verification outstanding).

## Completed
- React + TypeScript + Vite host scaffold.
- Official OpenChamber source pinned as a Git submodule.
- Upstream mobile browser entry, renderer, assets, CSS, theme, and browser API source wired through Vite aliases.
- Root npm manifest and committed package-lock for browser UI dependencies.
- Telegram lifecycle, initial viewport/theme integration, and safe-area styles.
- Telegram BackButton bridge to upstream mobile back-navigation state.
- Host typecheck scoped to local Telegram glue; Vite bundles the full upstream runtime.
- Same-origin deployment guide and Vite /miniapp/ build script.
- TGCloud config no longer publishes frontend files to its separate origin.
- Phase 0 checks passed on PR #1 before upstream integration (runs 41726418174 and 41726565011).

## Remaining work
1. Verify latest CI passes npm ci, host typecheck, and full upstream Vite build after worker.format='es'.
2. Review dependency audit advisories and upgrade/remove unsafe or unused paths without breaking upstream.
3. Verify same-origin deployment under /miniapp/, including pairing/authentication, API calls, streaming, WebSockets, assets, and Telegram Web CSP.
4. Test the official mobile UI on Telegram Android, iOS, Desktop, Telegram Web, and browser fallback.
5. Complete BotFather launch/menu docs and review/replace the TGCloud scaffold echo handler before production deployment.
6. Finish PR #1 review; do not open another PR while #1 remains open.

## Architecture and security boundaries
- UI source of truth is the pinned upstream mobile renderer, not a local recreation or desktop shell.
- OpenChamber Server remains privileged backend for sessions, OpenCode lifecycle, tools, filesystem, and Git.
- Upstream uses Bun workspaces, but this repository must not run Bun or introduce a Bun lockfile.
- npm run typecheck checks locally owned Telegram/Vite glue. npm run build is the full upstream bundle integration check.
- npm run build:miniapp:same-origin builds assets with base path /miniapp/.
- npm run deploy deploys only tgcloud/ backend modules. It does not publish frontend to TGCloud static hosting.
- Upstream CORS accepts same-origin plus packaged/local-dev origins. OPENCHAMBER_FRAME_ANCESTORS changes CSP framing only; it is not a CORS allowlist.
- Telegram Serverless modules run in Telegram's isolated V8 runtime, not ordinary Node.js.
- tgcloud/handlers/message.js is still the scaffold echo handler; review/replace before production.
- Never commit CLI credentials. Any CLI Access Token previously pasted into chat must be treated as compromised and revoked; authenticate locally with a newly issued token.

## Working rules
- Read this file before ROADMAP.md on every continuation.
- Audit current repository and PR state before each continuation.
- Use Node.js and npm only; use npm ci for reproducible installs.
- Do not edit files inside the upstream submodule or recreate the upstream UI locally.
- Do not claim UI/API parity, CI success, or deployment before the corresponding verification passes.
- Update this file and ROADMAP.md whenever the phase or a material decision changes.
- Keep secrets out of chat, source control, logs, and frontend environment variables.
