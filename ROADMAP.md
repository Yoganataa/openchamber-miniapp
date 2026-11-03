# Roadmap

The pinned OpenChamber mobile renderer is the UI source of truth. Do not independently recreate existing mobile screens or workflows.

## Phase 0 — Foundation
- [x] Define architecture boundaries and Telegram-host scope.
- [x] Scaffold React + TypeScript + Vite.
- [x] Add Telegram WebApp lifecycle foundation and browser fallback.
- [x] Add npm scripts, lockfile, and GitHub Actions CI.
- [x] Pin official OpenChamber source as a recursive Git submodule.
- [x] Verify the original scaffold before upstream renderer adoption (PR #1 runs 41726418174, 41726565011).

## Phase 1 — Official mobile UI adoption
- [x] Load upstream packages/web/src/mobile-main.tsx as the root browser runtime entry.
- [x] Use the upstream mobile.html shell and its pre-paint theme/background setup.
- [x] Render upstream renderMobileApp / MobileApp without copying or editing source inside the submodule.
- [x] Reuse upstream browser RuntimeAPIs, API adapters, CSS, fonts, icons, themes, and assets.
- [x] Resolve upstream SDK/UI/Web imports through root Vite aliases and npm dependencies.
- [x] Keep Telegram-specific boot and BackButton glue in this repository.
- [x] Pass npm ci, host typecheck, and full Vite build (run 41729605708, commit d7a79b2), plus production /miniapp/ build (run 41729951658, commit 2de9679).
- [x] Port upstream's manual chunk strategy; Mermaid and Markdown renderer are split from the eager bundle.
- [x] Verify the production build script under /miniapp/ (CI run 41729951658 on commit 2de9679).
- [ ] Verify navigation, chat, sessions, workspace drawer, files, changes, settings, error states, and attachments against live OpenChamber Server.
- [ ] Verify the app in Telegram Android, iOS, Desktop, Telegram Web, and fallback browser.

## Phase 2 — Telegram host and secure connectivity
- [x] Initialize Telegram WebApp ready/expand lifecycle.
- [x] Read Telegram viewport and color scheme and subscribe to viewport/theme events.
- [x] Apply safe-area support.
- [x] Bridge Telegram BackButton to upstream mobile back-stack handling.
- [x] Audit upstream origin/CORS and browser API boot contract at pinned revision.
- [ ] Verify upstream OpenChamber pairing/login in Telegram WebView.
- [ ] Confirm theme/viewport behavior after mount, including keyboard resize.
- [ ] Add BotFather setup, menu button, and launch/deep-link documentation.
- [ ] Validate Telegram initData server-side if it is used for identity mapping or authorization.
- [ ] Add API contract and Telegram host integration tests.

## Phase 3 — Mobile workflow parity
- [ ] Use the pinned mobile renderer as the parity baseline; do not rebuild its UI locally.
- [ ] Verify session list/history and session management.
- [ ] Verify composer, streaming, cancellation, reconnect, and attachments.
- [ ] Verify diff, Git status/actions, file browser, and terminal where supported by the browser runtime.
- [ ] Verify settings and other upstream mobile workflows.
- [ ] Define fallbacks for WebView/browser capabilities unavailable in Telegram.

## Phase 4 — Telegram Serverless (optional backend)
- [x] Add TGCloud project config, schema, and SDK reference.
- [x] Remove the unused starter echo handler so the first automated deployment does not echo users' messages. No chat-message handler is active until a real flow is designed.
- [x] Disable separate-origin TGCloud static frontend hosting; use same-origin hosting with OpenChamber Server.
- [x] Add GitHub Actions auto-deploy on main for `tgcloud/` backend changes using `TGCLOUD_TOKEN`; fetch remote revision first and push only tracked backend files.
- [x] Keep database migrations out of the unattended deployment workflow.
- [ ] Verify linked-bot eligibility, SDK runtime, quotas, and deployment flow on the user's actual bot.
- [ ] Add threat model and data-retention policy.
- [ ] Add initData-verified endpoints only if a real backend identity-mapping requirement exists.
- [ ] Add a narrow authenticated relay only if upstream server features require one and no same-origin route exists.

## Phase 5 — Release
- [ ] Verify full user flows end to end on supported Telegram clients.
- [ ] Review accessibility, performance, bundle size, and npm audit findings.
- [ ] Add error reporting with sensitive-data scrubbing.
- [ ] Complete same-origin deployment, rollback, operations, and security review.

## Non-goals
- Reimplementing OpenChamber mobile UI or backend.
- Running OpenCode or arbitrary Node.js processes inside Telegram Serverless.
- Direct filesystem/shell access from Telegram WebView.
- Deploying the frontend to TGCloud's separate static origin unless the upstream server CORS policy is intentionally changed and reviewed.

## Project toolchain
- Node.js >=24.14.0
- npm with committed package-lock.json
- No Bun commands, Bun lockfiles, or second package manager.
