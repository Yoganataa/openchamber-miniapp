# Roadmap

This roadmap tracks implementation status, not merely planned work. A task is complete only when its implementation is present and its stated verification has passed.

## Product fidelity rule

The Mini App uses the official OpenChamber mobile UI as its source of truth. Do not recreate the interface or independently reimplement existing mobile workflows. Local code should be limited to the Telegram host adapter, Mini App-specific authentication/bootstrap, and narrowly scoped integration glue. The upstream source pin and exact intended entry points are documented in [UPSTREAM-INTEGRATION.md](docs/UPSTREAM-INTEGRATION.md).

## Phase 0 — Foundation
- [x] Define scope and architecture boundaries.
- [x] Scaffold React + TypeScript + Vite.
- [x] Add Telegram WebApp adapter and browser fallback.
- [x] Add environment configuration and responsive shell.
- [x] Add typecheck/build scripts and GitHub Actions CI workflow.
- [x] Pin the official OpenChamber upstream source as a Git submodule.
- [x] Configure CI checkout to initialize recursive submodules.
- [ ] Verify npm ci, typecheck, and production build through a successful GitHub Actions run.

## Phase 1 — Official mobile UI adoption
- [ ] Replace the local placeholder screen with upstream `renderMobileApp` and `MobileApp`.
- [ ] Reuse the upstream mobile HTML boot and required CSS, fonts, icons, themes, and assets.
- [ ] Wire the upstream browser runtime configuration and API adapter without forking endpoint behavior.
- [ ] Keep all upstream source changes in the pinned submodule; keep Telegram-only glue local.
- [ ] Verify mobile navigation, chat, sessions, workspace drawer, files, changes, settings, and error states against upstream.
- [ ] Verify mobile browser behavior in Telegram Android, iOS, Desktop, and browser fallback.

## Phase 2 — Telegram host and secure connectivity
- [x] Initialize Telegram WebApp lifecycle (ready, expand) and read initial color scheme in the scaffold.
- [x] Apply mobile safe-area insets in the scaffold.
- [ ] Preserve Telegram lifecycle/theme/viewport integration after the upstream renderer becomes the entry point.
- [ ] Integrate Telegram BackButton with upstream mobile navigation/back-layer state.
- [ ] Add BotFather setup, menu button, and launch/deep-link documentation.
- [ ] Audit upstream OpenChamber API and authentication contract at the pinned revision.
- [ ] Implement secure server pairing/bootstrap using upstream-supported authentication flows.
- [ ] Validate Telegram initData server-side if Telegram identity is used for account mapping or authorization.
- [ ] Ensure credentials are not stored in frontend source, URL parameters, or public environment variables.
- [ ] Add API contract and Telegram host integration tests.

## Phase 3 — Mobile workflow parity
- [ ] Track upstream mobile renderer features as the parity baseline; do not rebuild existing surfaces locally.
- [ ] Verify session history and management.
- [ ] Verify message composer, streaming, cancellation, reconnect, and attachment handling.
- [ ] Verify diff viewer, Git status/actions, files, and terminal behavior supported by the upstream web runtime.
- [ ] Verify multi-run, settings, and other upstream mobile workflows.
- [ ] Define capability fallbacks for browser/WebView features unavailable in Telegram.

## Phase 4 — Trusted backend / Telegram Serverless
- [x] Add the official Telegram Serverless project configuration, starter handler/schema, and local SDK reference.
- [ ] Verify current SDK, runtime, quotas, deployment flow, and access eligibility using the linked bot.
- [ ] Review and replace the scaffold echo handler before production deployment.
- [ ] Document threat model and retention policy.
- [ ] Implement and test Telegram initData-verified endpoint calls.
- [ ] Add minimal identity/session mapping only if needed.
- [ ] Add narrowly scoped relay with allowlisted operations, authorization, validation, and rate limits.
- [ ] Add schema and deployment workflow only if supported and required.

## Phase 5 — Release
- [ ] End-to-end Telegram client testing.
- [ ] Accessibility, performance, and bundle review.
- [ ] Error reporting with sensitive-data scrubbing.
- [ ] Deployment, rollback, operations, and security review.

## Non-goals
- Running OpenCode or arbitrary Node.js processes inside Telegram Serverless.
- Replacing OpenChamber Server.
- Direct local filesystem or shell access from Telegram WebView.
- Reimplementing the OpenChamber backend.
- Creating a second, independently maintained OpenChamber mobile UI.

## Project toolchain
- Node.js >=24.14.0
- npm with the committed package-lock.json
- Do not introduce Bun or a second package manager.
