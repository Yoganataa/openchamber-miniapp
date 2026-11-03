# Roadmap

## Phase 0 — Foundation
- [x] Define scope and architecture boundaries.
- [ ] Scaffold React + TypeScript + Vite.
- [ ] Add Telegram WebApp adapter and browser fallback.
- [ ] Add environment configuration and responsive shell.
- [ ] Add typecheck, build, and CI.
- [ ] Verify install and build in GitHub Actions.

## Phase 1 — Telegram integration
- [ ] Initialize Telegram WebApp lifecycle (`ready`, `expand`, theme).
- [ ] Integrate BackButton and safe-area insets.
- [ ] Add BotFather setup and launch/deep-link documentation.
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
- [ ] Verify current SDK, runtime, quotas, deployment flow, and access eligibility.
- [ ] Document threat model and retention policy.
- [ ] Validate Telegram `initData` server-side.
- [ ] Add minimal identity/session mapping only if needed.
- [ ] Add narrowly scoped relay with allowlisted operations, authorization, validation, and rate limits.
- [ ] Add schema and deployment workflow if supported.

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
