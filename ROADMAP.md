# Roadmap

This roadmap tracks implementation status, not merely planned work. A task is complete only when its implementation is present and its stated verification has passed.

## Phase 0 — Foundation
- [x] Define scope and architecture boundaries.
- [x] Scaffold React + TypeScript + Vite.
- [x] Add Telegram WebApp adapter and browser fallback.
- [x] Add environment configuration and responsive shell.
- [x] Add typecheck/build scripts and GitHub Actions CI workflow.
- [ ] Verify npm ci, typecheck, and production build through a successful GitHub Actions run.

## Phase 1 — Telegram integration
- [x] Initialize Telegram WebApp lifecycle (ready, expand) and read initial color scheme.
- [x] Apply mobile safe-area insets in the responsive shell.
- [ ] Synchronize theme changes and Telegram theme parameters after launch.
- [ ] Integrate BackButton with route/navigation state.
- [ ] Add BotFather setup, menu button, and launch/deep-link documentation.
- [ ] Test Telegram Android, iOS, Desktop, and browser fallback.

## Phase 2 — OpenChamber connectivity
- [ ] Audit public OpenChamber API and authentication contract.
- [ ] Implement typed API client for supported endpoints.
- [ ] Design secure server pairing; never put credentials in URLs or frontend bundles.
- [ ] Implement session list, session selection, streaming chat, cancellation, and reconnect.
- [ ] Implement model selection and error/empty/loading states.
- [ ] Add API contract tests.

## Phase 3 — Mobile workflow parity
- [ ] Session history and management.
- [ ] Message composer and attachment handling.
- [ ] Diff viewer and Git status/actions.
- [ ] Multi-run and other supported workflows.
- [ ] Preview through an explicit server-side contract.
- [ ] Capability handling for unavailable WebView features.

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

## Project toolchain
- Node.js >=24.14.0
- npm with the committed package-lock.json
- Do not introduce Bun or a second package manager.
