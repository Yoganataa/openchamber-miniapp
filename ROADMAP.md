# Roadmap

This roadmap tracks implementation status, not merely planned work. A task is complete only when its implementation is present and its stated verification has passed.

## Product fidelity rule

The Mini App uses the official OpenChamber mobile UI as its source of truth. Do not recreate the interface or independently reimplement mobile workflows. Local code is limited to Telegram host integration and narrowly scoped bootstrap/deployment glue.

## Phase 0 — Foundation
- [x] Define scope and architecture boundaries.
- [x] Scaffold React + TypeScript + Vite.
- [x] Add Telegram WebApp lifecycle foundation and browser fallback.
- [x] Add environment configuration and host styles.
- [x] Add npm scripts and GitHub Actions CI.
- [x] Pin official OpenChamber source as recursive Git submodule.
- [x] Establish committed npm lockfile for the upstream browser dependency set.
- [x] Verify original scaffold before adopting upstream UI (PR #1 runs 41726418174 and 41726565011).

## Phase 1 — Official mobile UI adoption
- [x] Replace local placeholder entry with upstream packages/web/src/mobile-main.tsx.
- [x] Load upstream renderMobileApp / MobileApp, styles, fonts, icons, themes, and runtime assets from pinned source.
- [x] Reuse upstream browser runtime and API adapters instead of implementing alternate endpoints.
- [x] Keep upstream source unchanged; keep Telegram-specific glue local.
- [x] Integrate Telegram BackButton with upstream handleNativeBack navigation state.
- [ ] Verify full production Vite bundle after worker-format compatibility fix.
- [ ] Verify mobile navigation, chat, sessions, workspace drawer, files, changes, settings, and error states against upstream.
- [ ] Verify browser behavior inside Telegram Android, iOS, Desktop, Telegram Web, and fallback browser.

## Phase 2 — Telegram host and secure connectivity
- [x] Initialize Telegram WebApp lifecycle and initial viewport/theme state.
- [x] Apply CSS safe-area support.
- [x] Bridge Telegram BackButton to upstream mobile back-stack behavior.
- [x] Audit upstream browser API and origin/authentication constraints at the pinned revision.
- [ ] Verify upstream pairing/login flow from Telegram WebView.
- [ ] Verify theme and viewport updates after runtime mount, including keyboard and viewport resize.
- [ ] Add BotFather setup, menu button, and launch/deep-link documentation.
- [ ] Validate Telegram initData server-side if Telegram identity is used for account mapping or authorization.
- [ ] Add API contract and Telegram host integration tests.

## Phase 3 — Mobile workflow parity
- [ ] Track the pinned upstream mobile renderer as parity baseline; do not rebuild existing surfaces locally.
- [ ] Verify session history and management.
- [ ] Verify message composer, streaming, cancellation, reconnect, and attachment handling.
- [ ] Verify diff viewer, Git status/actions, files, and terminal capabilities supported by browser runtime.
- [ ] Verify multi-run, settings, and other upstream mobile workflows.
- [ ] Define capability fallbacks for browser/WebView APIs unavailable in Telegram.

## Phase 4 — Trusted backend / Telegram Serverless
- [x] Add Telegram Serverless project configuration, starter handler/schema, and SDK reference.
- [x] Keep TGCloud frontend static hosting disabled because its separate origin conflicts with upstream server CORS policy.
- [ ] Verify current SDK, runtime, quotas, deployment flow, and access eligibility using linked bot.
- [ ] Review and replace scaffold echo handler before production deployment.
- [ ] Document threat model and retention policy.
- [ ] Implement and test Telegram initData-verified endpoints only if identity mapping is required.
- [ ] Add minimal identity/session mapping only if needed.
- [ ] Add narrowly scoped relay only when required, with explicit allowlist, authorization, validation, and rate limits.

## Phase 5 — Release
- [ ] End-to-end Telegram client testing.
- [ ] Accessibility, performance, bundle-size, and dependency audit review.
- [ ] Error reporting with sensitive-data scrubbing.
- [ ] Same-origin deployment, rollback, operations, and security review.

## Non-goals
- Running OpenCode or arbitrary Node.js processes inside Telegram Serverless.
- Replacing OpenChamber Server.
- Direct local filesystem or shell access from Telegram WebView.
- Reimplementing OpenChamber backend or mobile UI.
- Deploying the Mini App to a separate TGCloud static origin unless upstream server origin policy is intentionally changed and security-reviewed.

## Project toolchain
- Node.js >=24.14.0
- npm with committed package-lock.json
- Do not introduce Bun or a second package manager.
