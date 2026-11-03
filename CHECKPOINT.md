# Checkpoint

Last audited: 2026-11-04
Repository: https://github.com/Yoganataa/openchamber-miniapp
Default branch: main
Working branch: feat/upstream-openchamber-mobile-ui
Open PR: https://github.com/Yoganataa/openchamber-miniapp/pull/1 (draft)

## Current state
- The root app now loads the official OpenChamber mobile app from the pinned submodule, not a locally recreated interface.
- Upstream is pinned in vendor/openchamber at commit 1e74724fc04026e3666f0802a6040f0f24c74226 (application version 2.6.0).
- The root Vite entry imports upstream packages/web/src/mobile-main.tsx. That creates the official browser RuntimeAPIs and renders renderMobileApp / MobileApp.
- Root index.html is based on the upstream packages/web/mobile.html shell. Only two host changes are made: load Telegram's WebApp SDK and use local src/main.tsx as the entry.
- Local Telegram integration handles ready/expand, viewport updates, color-scheme host state, and Telegram BackButton. A guarded Vite transform routes BackButton to the exact upstream mobile handleNativeBack callback.
- Upstream files in vendor/openchamber remain unchanged.
- The project is Node.js >=24.14.0 + npm only. The npm lockfile for browser dependencies was generated and committed by GitHub Actions at 176dfcafc8b4f8b84b0ec6b14be0715d63bb7ab3.
- Latest root-path integration verification passed on commit d7a79b2e1bccf9af227f1f9d6348894a560fca52, run 41729605708: npm ci, Telegram host typecheck, and full Vite bundle all succeeded.
- The official upstream Vite chunking strategy was adapted locally. In the passing build, Mermaid was 29.52 KB and MarkdownRendererImpl 95.23 KB; renderMobileApp remains 5.74 MB raw / 1.65 MB gzip, and heic2any is 1.35 MB raw / 341 KB gzip. Review real-world load performance without removing upstream functionality.
- The production /miniapp/ build passed on commit 2de967909ee042ca8463871e6a56707097324eb7, run 41729951658. The subsequent docs-only head 5550eee2e04a034035d470e079dff8fe8cb889a9 has the same implementation and its CI run is still completing.
- npm ci reported 10 dependency audit findings (5 low, 4 high, 1 critical). Inspect the advisory tree before release; do not run npm audit fix --force.
- Production must use the same scheme, host, and port as OpenChamber Server. The pinned server CORS policy does not allow arbitrary TGCloud static origins. TGCloud frontend static hosting is intentionally disabled; TGCloud remains available for optional backend modules.

## Active phase
Phase 1 — Official mobile UI adoption. The renderer and Telegram host bridge are integrated, and full Vite build and production /miniapp/ build both passed. Live Telegram runtime testing remains.

## Completed
- React + TypeScript + Vite host scaffold.
- Official OpenChamber source pinned as a recursive Git submodule.
- Official upstream mobile HTML shell, browser entry, renderer, runtime API, assets, CSS, fonts, and themes integrated.
- Root npm manifest and committed package-lock for required browser dependencies.
- Vite aliases for upstream UI, Web runtime, and SDK.
- Telegram lifecycle, viewport, theme host state, safe-area styling, and BackButton bridge to upstream navigation.
- Vite worker format set to ES, matching upstream.
- Upstream manualChunks strategy ported to keep dynamically loaded syntax grammars, diff highlights, and markdown renderer out of eager vendor chunks.
- Same-origin deployment guidance and build script for /miniapp/.
- TGCloud static frontend hosting removed to avoid separate-origin API CORS failures.
- CI passed on d7a79b2 (run 41729605708) for npm ci, host typecheck, and root-path full Vite build.

## Remaining work
1. Verify the docs-only head CI run completes successfully.
2. Verify the deployed app on the same OpenChamber Server origin, including assets, login/pairing, API calls, streaming, WebSockets, and CSP embedding.
3. Test official mobile workflows on Telegram Android, iOS, Desktop, Telegram Web, and browser fallback.
4. Review npm audit advisories and bundle performance; do not remove upstream features to reduce size without an explicit product decision.
5. Complete BotFather launch/menu docs and review/replace the Telegram Serverless echo handler before any production backend deployment.
6. Finish PR #1 review; do not open another PR while #1 remains open.

## Architecture and security boundaries
- UI source of truth is pinned upstream MobileApp/renderMobileApp, not desktop App.tsx and not a local clone.
- OpenChamber Server remains privileged backend for sessions, OpenCode lifecycle, tools, filesystem, and Git.
- The upstream monorepo uses Bun, but this repository must not run Bun or add a Bun lockfile.
- npm run typecheck checks locally owned Telegram/Vite host glue; Vite build bundles the full upstream renderer and runtime.
- npm run build:miniapp:same-origin builds for /miniapp/.
- npm run deploy fetches the current TGCloud revision and pushes only tgcloud/ backend modules, not the frontend.
- Automatic deployment runs only on main and only when tgcloud source/config, package manifest/lock, or the deploy workflow changes. Required repository secret: TGCLOUD_TOKEN.
- Database migrations are never run automatically; review and apply schema changes separately.
- Upstream CORS accepts same-origin plus packaged/local-dev origins. OPENCHAMBER_FRAME_ANCESTORS controls CSP framing only; it is not a CORS allowlist.
- Telegram Serverless modules run in Telegram's isolated V8 runtime, not ordinary Node.js.
- tgcloud/handlers/message.js is still the scaffold echo handler; do not deploy it to production before review/replacement.
- Never commit CLI credentials. Any CLI Access Token previously pasted into chat must be treated as compromised and revoked; authenticate locally with a newly issued token.

## Working rules
- Read this file before ROADMAP.md on every continuation.
- Audit the current repo, PR, and CI before every continuation.
- Use Node.js and npm only; use npm ci for reproducible installs.
- Do not modify vendor/openchamber or recreate upstream UI locally.
- Do not claim 1:1 runtime parity, CI success, or deployment before actual verification.
- Update this file and ROADMAP.md when phase status or material decisions change.
- Keep secrets out of chat, source control, logs, and frontend environment variables.
