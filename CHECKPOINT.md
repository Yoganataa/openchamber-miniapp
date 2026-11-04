# Checkpoint

Last audited: 2026-11-04
Repository: https://github.com/Yoganataa/openchamber-miniapp
Default branch: main
Last audited main head: `b3b10d6a18e717e92c8bb6818d3d2782a760ae05`
Working branch: none (Phase 2 implementation PRs are merged)
PR #1 merged: https://github.com/Yoganataa/openchamber-miniapp/pull/1
PR #2 merged: https://github.com/Yoganataa/openchamber-miniapp/pull/2 (merge commit `b929a9d6384c515c6592ae3ddf7ebe6de1ea5038`)
PR #3 merged: https://github.com/Yoganataa/openchamber-miniapp/pull/3 (merge commit `9f3ea4c8c20f92f2df747f39ba39d31f5e966c3a`)
PR #4 merged: https://github.com/Yoganataa/openchamber-miniapp/pull/4 (merge commit `d5e19316887a281ce3ebaab330fe44cf5cf346e6`)
PR #5 merged: https://github.com/Yoganataa/openchamber-miniapp/pull/5 (merge commit `eee22852a24a6c246ca1262762162bd147c73f36`)

## Current state

- Telegram account-isolation implementation from PR #4 is merged into `main` (merge commit `d5e1931`). PR #5 is also merged into `main` (merge commit `eee2285`), fixing pairing-v2 QR parsing, relay URL metadata normalization, account-sync error classification, and the startup/error presentation.
- PR #5 CI run 41808417355 passed workflow validation, Serverless/RichMessage contracts, host typecheck, and the root-path production build. Post-merge `main` CI run 41864367356 and TGCloud deployment run 41864367277 both completed successfully. The safe-migration workflow fix also passed main CI run 41872648955 and its production static deployment run 41872648961. The app deployment is successful; the separate production database migration is not.
- New backend contract: one `telegram_instances` row per verified Telegram user ID, with `telegram_user_id` as the SQLite primary key and a stable server-generated instance ID. The database contains transport metadata only; it never stores OpenChamber client tokens.
- New Serverless endpoints: `getMyInstance`, `saveMyInstance`, and `deleteMyInstance`. Each endpoint reads the owner exclusively from verified `ctx.initData.user.id`.
- The Mini App host namespaces upstream browser storage by verified Telegram account, uses Telegram SecureStorage for per-device client credentials where supported, purges legacy origin-wide keys, forces `credentials: omit` for all active OpenChamber runtime requests (direct and Private Relay), rejects cookie-only login, and waits for account mapping/credential persistence before pairing or login completes.
- The bot private-chat `/start` handler sends a Bot API 10.3 RichMessage with greeting, connection instructions, Terms of Service, Privacy Policy, FAQ, compact ownership table, expandable quotation, and Mini App button. The policy text is a product draft and should receive legal review before a public launch.
- Production database changes remain manual and are not part of the deploy workflow. The PR #4 schema deployment completed on `main` by run 41803319896; PR #5's app deployment completed by run 41864367277. Migration run 41871919619 failed only because the non-interactive GitHub runner invoked `npx tgcloud migrate` without a required mode flag; `npx tgcloud fetch` succeeded and updated the snapshot to cloud revision 6. The workflow now invokes `npx tgcloud migrate --safe`, which auto-applies additive/safe changes and skips warning/destructive and manual changes. It intentionally does not use `--yes`. The production migration remains pending until the corrected manual workflow is run and verified successful. The existing owner must pair again after the legacy storage purge.

- The root app uses the official OpenChamber mobile browser entry from the recursive `vendor/openchamber` submodule.
- Upstream pin: `1e74724fc04026e3666f0802a6040f0f24c74226`, OpenChamber 2.6.0. Upstream source remains untouched.
- Root Vite app loads `packages/web/src/mobile-main.tsx`, which creates the official browser RuntimeAPIs and renders the upstream mobile UI.
- `src/main.tsx` initializes Telegram lifecycle/viewport/theme and marks this host as a pairing-first Mini App. It does not hardcode an OpenChamber server URL.
- The local guarded Vite bridge keeps Telegram BackButton aligned with upstream navigation and exposes upstream pairing-v2 onboarding to the browser host. It fails the build when its upstream source markers no longer match.
- The upstream Scan QR action is adapted to Telegram's native `showScanQrPopup` API. PR #2 was merged and deployed successfully in TGCloud run 41771745665. PR #5 additionally handles percent-encoded pairing links and uses the URL-string pairing parser before the WebView URL API parser, covering older Android WebViews that misparse the `openchamber://` scheme. Manual link entry remains the fallback on Telegram clients without the scanner API (requires WebApp version 7.7+ for the popup-close event).
- Choose **Anywhere** in OpenChamber's Add a device flow to include the official Private Relay transport. The Mini App uses the upstream pairing redemption and E2E relay implementation; it does not need a separately hosted OpenChamber API or custom relay.
- TGCloud static hosting is configured to publish Vite `dist/` at the root. TGCloud backend modules remain optional and scoped under `tgcloud/`.
- Initial production deployment completed successfully on 2026-11-04 via GitHub Actions run 41769613500 at merge commit `daabac4cb111faadfe2b6393bcea46fa65b4d242`.
- PR #4 account-isolation/schema deployment completed successfully on `main` via TGCloud run 41803319896 at merge commit `d5e19316887a281ce3ebaab330fe44cf5cf346e6`. PR #5 merge triggered TGCloud deployment run 41864367277, which completed successfully. The subsequent migration-workflow hardening change deployed successfully in run 41872648961.
- TGCloud published 944 static files (51.2 MB) and registered the optional `tgcloud/schema.js` module. The CLI-reported Mini App URL is `https://app8984347139.tgcloud.ai/`.
- QR scanner redeployment: PR #2 merged as `b929a9d6384c515c6592ae3ddf7ebe6de1ea5038`; CI run 41771593637 passed; `main` CI run 41771745732 passed; TGCloud deploy run 41771745665 passed and uploaded the changed `dist/` bundle (38 files, 18.0 MB) to the same static URL.
- The production deploy workflow successfully consumed Environment secret `ACCESS_TOKEN` through the `TGCLOUD_TOKEN` mapping. Main-branch CI run 41769613483 also passed `npm ci`, host typecheck, and the root-path build.
- The deploy workflow targets GitHub Environment `production`, maps `secrets.ACCESS_TOKEN` to CLI variable `TGCLOUD_TOKEN`, runs `npx tgcloud fetch`, then publishes the configured `dist/` static build and changed `tgcloud/` modules with one `npx tgcloud push`. This is a single atomic TGCloud deployment; it does not use `--force` or apply database migrations.
- The manual migration workflow uses `npx tgcloud migrate --safe` to satisfy the CLI's non-interactive requirement without auto-approving destructive warnings. `scripts/validate-github-workflows.mjs` now guards against removing `--safe` or replacing it with `--yes`. Deployment instructions include the local `--dry-run` review step.
- Environment `production` and secret `ACCESS_TOKEN` were shown by the user; allowed deployment branch is `main`. Secret values are not inspected.
- Before account-isolation rollout, browser upstream persistence stored the issued client token in origin-wide WebView local storage. The account-scoped storage migration intentionally purges those legacy origin-wide keys and does not attribute the old token to a Telegram account.
- Upstream `mobile.connect.error.authRequired` is a generic pairing/login message used when pairing redemption fails, a response omits a client token, or native secure-token persistence fails. The old host transform also allowed Telegram account-sync failures to fall through the same generic pairing error path. PR #5 separates `[telegram-instance-sync]` failures and shows a dedicated account-save error. It also accepts harmless Private Relay URL query parameters (while rejecting credential-bearing keys), strips fragments, and bounds labels to match pairing-v2 metadata semantics. This explains a plausible source of the reported red message, but a real post-deploy Telegram scan is still required to confirm the user's exact runtime path.
- Earlier npm install reported 10 dependency audit findings (5 low, 4 high, 1 critical). Review advisories before release; do not run `npm audit fix --force`.

## Upstream maintenance

- `.github/workflows/upstream-sync.yml` is active on `main` after PR #3 was merged. It checks `openchamber/openchamber:main` daily at 02:17 UTC and supports manual dispatch.
- The watcher uses the GitHub compare API to require a fast-forward from the current pin, validates the candidate with `npm ci`, `npm run typecheck`, and `npm run build`, then creates or updates `automation/openchamber-upstream` and a review PR.
- The watcher never merges or deploys. Merging the PR into `main` triggers the production workflow. The current pin remains `1e74724fc04026e3666f0802a6040f0f24c74226` (2.6.0); at audit time upstream `main` is 18 commits ahead and identifies as 2.6.1.
- Production publishing now uses the official TGCloud full-project push: build, `npx tgcloud fetch`, then one `npx tgcloud push` to publish the configured `dist/` static site and changed `tgcloud/` modules atomically. It does not run migrations or use `--force`.

## Active phase

Phase 2 — Telegram account isolation, pairing and remote runtime verification. PR #4 and PR #5 are merged; PR #5's main CI and TGCloud deployment succeeded. The account-isolation database migration remains pending after a non-interactive CLI invocation error; the workflow command is fixed to use safe-only mode and needs a manual rerun. Real QR camera flow, pairing-v2 redemption, Private Relay, and live OpenChamber workflows still require verification on the actual Telegram bot/devices.

## Completed implementation

- React + TypeScript + Vite host scaffold with Node.js 24.14+ and npm only.
- Pinned recursive OpenChamber mobile UI submodule, upstream browser entry, styles, fonts, assets and runtime.
- Root-level Telegram lifecycle, viewport/theme bridge, safe-area styles and BackButton integration.
- Guarded local Vite transforms that expose upstream pairing-v2 onboarding and route the upstream Scan QR action to Telegram's native QR popup without editing upstream source.
- Telegram native QR popup adapter, upstream payload validation, cancel/abort handling, and manual-link fallback.
- Pairing-v2 URL-string parsing for encoded/custom-scheme QR payloads, consistent Private Relay candidate metadata normalization, explicit Telegram account-sync failure messaging, and branded accessible startup/retry error UI (PR #5).
- TGCloud static config for root-level `dist/` output.
- Deployment script and GitHub Actions workflow for static Mini App plus scoped `tgcloud/` modules, using Environment secret `ACCESS_TOKEN`.
- No echo handler, bot message handler, custom API proxy, new relay or automated database migration.

## Remaining work

1. PR #5 main CI run 41864367356 and TGCloud deployment run 41864367277 passed; the app code is deployed.
2. Manually rerun **Migrate Telegram Serverless database** from GitHub Actions on `main`. The workflow now uses `npx tgcloud migrate --safe`; confirm that the migration job completes successfully. Do not use `--yes`.
3. Reload the deployed Mini App. Because pairing-v2 links are single-use and the account-scoped migration purges legacy credentials, create a fresh **Anywhere** pairing QR/link and scan it again if the previous link was consumed.
4. Verify the reported pairing error is gone. Confirm that pairing writes one Telegram-owned instance record and a device client token, then that the app loads the official OpenChamber mobile runtime through direct/Private Relay transport.
5. Test two Telegram accounts in the same Telegram client: the owner's account must restore only its own instance; the second account must see a clean onboarding and must not inherit any server session.
6. Test two devices on the same Telegram account: the server-side `instance_id` must remain stable while each device uses its own client credential.
7. Verify Telegram SecureStorage and the compatibility fallback in Telegram clients that do not support it.
8. Confirm `/start` renders the RichMessage 10.3 greeting, Terms, Privacy Policy and FAQ.
## Architecture and security boundaries

- UI source of truth is pinned upstream MobileApp/renderMobileApp, not desktop App.tsx and not a locally recreated interface.
- OpenChamber Server remains on the user's machine and retains responsibility for sessions, OpenCode lifecycle, tools, filesystem and Git.
- TGCloud serves the static Mini App and optional Telegram Serverless modules. It does not host or replace OpenChamber Server.
- Official pairing-v2 establishes the client identity. Choose Anywhere to allow the upstream E2E Private Relay transport when direct connectivity is unavailable.
- The relay is a transport only; it does not grant authorization by itself. The host still authenticates each request.
- Do not put server URLs with permanent credentials, client tokens, bot tokens or CLI tokens into frontend code or `VITE_*` variables.
- The pending Telegram account adapter scopes browser storage by verified Telegram user ID and uses per-device Telegram SecureStorage where available. Device-token revocation is still performed at the OpenChamber host.
- The upstream monorepo uses Bun, but this project must remain Node.js + npm only. Do not add a Bun lockfile or second package manager.
- `npm run typecheck` checks local host glue; `npm run build` bundles the full pinned upstream renderer.
- `npm run deploy` builds the frontend, fetches TGCloud state, then uses one `npx tgcloud push` to publish static assets and changed `tgcloud/` modules in one batch. Never use `--force`; database migrations remain manual.
- GitHub Actions deployment only runs on `main` and consumes GitHub Environment `production` secret `ACCESS_TOKEN`, mapped to `TGCLOUD_TOKEN`.
- `.tgcloud/` remains ignored local CLI state. Never inspect, expose or commit its credentials.

## Working rules

- Read this file before ROADMAP.md on every continuation.
- Audit current repository, PR and CI before each continuation.
- Use Node.js and npm only; use `npm ci` for reproducible installs.
- Never edit files inside `vendor/openchamber` or recreate existing upstream UI locally.
- Never claim pairing, CI, deployment or live compatibility until each has been verified.
- Update this file and ROADMAP.md whenever phase status or a material decision changes.
