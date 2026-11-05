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
- [x] Verify the root-path TGCloud static build (CI run 41769424938) and production deployment (run 41769613500; 944 files / 51.2 MB uploaded).
- [x] Verify the QR scanner follow-up root build (main CI run 41771745732) and production redeployment (run 41771745665; 38 changed files / 18.0 MB uploaded).
- [x] Add daily upstream `main` watcher with fast-forward guard, candidate typecheck/build, and a review-only PR workflow; never auto-merge or deploy from the watcher.
- [ ] Verify navigation, chat, sessions, workspace drawer, files, changes, settings, error states, and attachments against live OpenChamber Server.
- [ ] Verify the app in Telegram Android, iOS, Desktop, Telegram Web, and fallback browser.

## Phase 2 — Telegram host and secure connectivity
- [x] Initialize Telegram WebApp ready/expand lifecycle.
- [x] Read Telegram viewport and color scheme and subscribe to viewport/theme events.
- [x] Apply safe-area support.
- [x] Bridge Telegram BackButton to upstream mobile back-stack handling.
- [x] Expose the upstream pairing-v2 connection screen in the Telegram browser host without recreating its UI.
- [x] Configure the Mini App host to discover the OpenChamber server through pairing instead of a build-time server URL.
- [ ] Verify Anywhere pairing and Private Relay redemption from the deployed Telegram WebView after PR #5 post-merge TGCloud deployment run 41864367277 completes.
- [x] Route the upstream Scan QR action to Telegram's native `showScanQrPopup` API and validate scans with the upstream pairing-v2 parser; keep manual link entry as fallback (PR #2, CI run 41771593637).
- [x] Harden pairing-v2 scan compatibility for percent-encoded custom-scheme links and older Android WebViews; preserve safe transport URL query parameters while rejecting credential-bearing parameters; classify Telegram account-sync failures separately from auth failures; provide branded startup/error/retry UI. Follow-up: direct HTTP(S) URL query compatibility deployed (CI 41964744036; TGCloud deployment 41964743837). A later live attempt still returned `INVALID_INSTANCE`; pinned upstream strips direct URL queries before persistence, so that earlier hypothesis is not established as the cause. Safe field-category validator diagnostics were deployed in TGCloud run 41966296794 (CI run 41966296777). Re-run with a fresh QR to identify the exact rejected field before relaxing constraints.
- [x] Audit the pinned upstream browser runtime, pairing-v2 and Private Relay transport contracts.
- [ ] Verify the deployed Telegram native QR popup opens, scans a real pairing QR, closes on cancel, and redeems pairing on Telegram Android/iOS/Desktop (TGCloud deployment run 41771745665).
- [ ] Confirm theme/viewport behavior after mount, including keyboard resize.
- [x] Document BotFather Main Mini App, chat menu button, and direct-link setup in README and deployment guide.
- [x] Validate Telegram initData server-side and derive the sole instance owner from verified ctx.initData.user.id.
- [x] Add one-row-per-account SQLite ownership with stable server-issued instance identity.
- [x] Isolate upstream local/session storage by Telegram account; keep per-device credentials out of SQLite and use Telegram SecureStorage when available.
- [x] Prevent cookie-backed OpenChamber session reuse in the Telegram host, including all `runtimeFetch` calls to direct and Private Relay runtimes.
- [x] Add /start RichMessage Bot API 10.3 greeting with TOS, Privacy Policy, FAQ and Mini App entry.
- [x] Add Serverless account-ownership and RichMessage contract tests.
- [x] Apply and verify the production SQLite migration manually. Run 41964142017 completed successfully on 2026-11-05; TGCloud confirmed the database was already in sync with `tgcloud/schema.js`.
- [ ] Verify same-client account isolation, same-account multi-device behavior and Telegram SecureStorage on real Telegram clients.

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
- [x] Enable Telegram Serverless static hosting for the Vite dist/ output; select the OpenChamber runtime through official pairing and Private Relay.
- [x] Add GitHub Actions auto-deploy on main for the static Mini App and scoped `tgcloud/` modules using Environment secret `ACCESS_TOKEN`; fetch remote revision before deployment.
- [x] Deploy configured static `dist/` and changed `tgcloud/` modules with one `npx tgcloud push` so the frontend and modules publish atomically.
- [x] Bind the deploy job to GitHub Environment `production`; read the environment-scoped `ACCESS_TOKEN` secret and map it to `TGCLOUD_TOKEN`.
- [x] Keep database migrations out of the unattended deployment workflow.
- [x] Confirm Environment `production` and Environment secret `ACCESS_TOKEN`; verify main-branch eligibility and actual TGCloud deployment (run 41769613500).
- [x] Add verified-initData endpoints and SQLite schema for account-owned instances.
- [x] Add a manual GitHub Actions workflow for reviewed Serverless DB migrations; normal deploys still never migrate automatically.
- [x] Make the manual migration command compatible with non-interactive Actions by using `tgcloud migrate --safe`; add a CI guard that rejects removal of `--safe` or use of `--yes` in the production migration workflow.
- [x] Apply and verify the production migration on the user's actual bot (workflow run 41964142017 succeeded; no schema changes remained).
- [ ] Verify Telegram Serverless SDK runtime and quotas on the user's actual bot.
- [ ] Add threat model and data-retention policy.
- [ ] Add initData-verified endpoints only if a real backend identity-mapping requirement exists.
- [x] Reuse the official OpenChamber Private Relay; do not implement a second relay or custom API proxy in this project.

## Phase 5 — Release
- [ ] Verify full user flows end to end on supported Telegram clients.
- [ ] Review accessibility, performance, bundle size, and npm audit findings.
- [ ] Add error reporting with sensitive-data scrubbing.
- [ ] Complete TGCloud static deployment, rollback, operations, pairing and security review.

## Non-goals
- Reimplementing OpenChamber mobile UI or backend.
- Running OpenCode or arbitrary Node.js processes inside Telegram Serverless.
- Direct filesystem/shell access from Telegram WebView.
- Reimplementing OpenChamber's pairing-v2 protocol or Private Relay.

## Project toolchain
- Node.js >=24.14.0
- npm with committed package-lock.json
- No Bun commands, Bun lockfiles, or second package manager.
