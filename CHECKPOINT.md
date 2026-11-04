# Checkpoint

Last audited: 2026-11-04
Repository: https://github.com/Yoganataa/openchamber-miniapp
Default branch: main
Working branch: fix/telegram-account-isolation
PR #1 merged: https://github.com/Yoganataa/openchamber-miniapp/pull/1
PR #3 merged: https://github.com/Yoganataa/openchamber-miniapp/pull/3 (merge commit `9f3ea4c8c20f92f2df747f39ba39d31f5e966c3a`)

## Current state

- Security hardening is implemented on `fix/telegram-account-isolation` in PR #4. Latest CI run 41791226899 passed workflow validation, Serverless/RichMessage contracts, host typecheck, and the root-path production build. PR review and merge are pending.
- New backend contract: one `telegram_instances` row per verified Telegram user ID, with `telegram_user_id` as the SQLite primary key and a stable server-generated instance ID. The database contains transport metadata only; it never stores OpenChamber client tokens.
- New Serverless endpoints: `getMyInstance`, `saveMyInstance`, and `deleteMyInstance`. Each endpoint reads the owner exclusively from verified `ctx.initData.user.id`.
- The Mini App host namespaces upstream browser storage by verified Telegram account, uses Telegram SecureStorage for per-device client credentials where supported, purges legacy origin-wide keys, forces `credentials: omit` for all active OpenChamber runtime requests (direct and Private Relay), rejects cookie-only login, and waits for account mapping/credential persistence before pairing or login completes.
- The bot private-chat `/start` handler sends a Bot API 10.3 RichMessage with greeting, connection instructions, Terms of Service, Privacy Policy, FAQ, compact ownership table, expandable quotation, and Mini App button. The policy text is a product draft and should receive legal review before a public launch.
- Production database changes remain manual: merge/deploy the schema, then run the `Migrate Telegram Serverless database` workflow against `main`. No migration has been run for this change yet. The existing owner must pair once after the legacy storage purge.

- The root app uses the official OpenChamber mobile browser entry from the recursive `vendor/openchamber` submodule.
- Upstream pin: `1e74724fc04026e3666f0802a6040f0f24c74226`, OpenChamber 2.6.0. Upstream source remains untouched.
- Root Vite app loads `packages/web/src/mobile-main.tsx`, which creates the official browser RuntimeAPIs and renders the upstream mobile UI.
- `src/main.tsx` initializes Telegram lifecycle/viewport/theme and marks this host as a pairing-first Mini App. It does not hardcode an OpenChamber server URL.
- The local guarded Vite bridge keeps Telegram BackButton aligned with upstream navigation and exposes upstream pairing-v2 onboarding to the browser host. It fails the build when its upstream source markers no longer match.
- The upstream Scan QR action is now adapted to Telegram's native `showScanQrPopup` API. PR #2 was merged on 2026-11-04 and the update was deployed successfully in TGCloud run 41771745665. The adapter validates scanned payloads with upstream pairing-v2 parsers; manual link entry remains the fallback on Telegram clients without the scanner API (requires WebApp version 7.7+ for the popup-close event).
- Choose **Anywhere** in OpenChamber's Add a device flow to include the official Private Relay transport. The Mini App uses the upstream pairing redemption and E2E relay implementation; it does not need a separately hosted OpenChamber API or custom relay.
- TGCloud static hosting is configured to publish Vite `dist/` at the root. TGCloud backend modules remain optional and scoped under `tgcloud/`.
- Production deployment completed successfully on 2026-11-04 via GitHub Actions run 41769613500 at merge commit `daabac4cb111faadfe2b6393bcea46fa65b4d242`.
- TGCloud published 944 static files (51.2 MB) and registered the optional `tgcloud/schema.js` module. The CLI-reported Mini App URL is `https://app8984347139.tgcloud.ai/`.
- QR scanner redeployment: PR #2 merged as `b929a9d6384c515c6592ae3ddf7ebe6de1ea5038`; CI run 41771593637 passed; `main` CI run 41771745732 passed; TGCloud deploy run 41771745665 passed and uploaded the changed `dist/` bundle (38 files, 18.0 MB) to the same static URL.
- The production deploy workflow successfully consumed Environment secret `ACCESS_TOKEN` through the `TGCLOUD_TOKEN` mapping. Main-branch CI run 41769613483 also passed `npm ci`, host typecheck, and the root-path build.
- The deploy workflow targets GitHub Environment `production`, maps `secrets.ACCESS_TOKEN` to CLI variable `TGCLOUD_TOKEN`, runs `npx tgcloud fetch`, then publishes the configured `dist/` static build and changed `tgcloud/` modules with one `npx tgcloud push`. This is a single atomic TGCloud deployment; it does not use `--force` or apply database migrations.
- Environment `production` and secret `ACCESS_TOKEN` were shown by the user; allowed deployment branch is `main`. Secret values are not inspected.
- Before account-isolation rollout, browser upstream persistence stored the issued client token in origin-wide WebView local storage. The pending migration intentionally purges those legacy origin-wide keys and does not attribute the old token to a Telegram account.
- Earlier npm install reported 10 dependency audit findings (5 low, 4 high, 1 critical). Review advisories before release; do not run `npm audit fix --force`.

## Upstream maintenance

- `.github/workflows/upstream-sync.yml` is active on `main` after PR #3 was merged. It checks `openchamber/openchamber:main` daily at 02:17 UTC and supports manual dispatch.
- The watcher uses the GitHub compare API to require a fast-forward from the current pin, validates the candidate with `npm ci`, `npm run typecheck`, and `npm run build`, then creates or updates `automation/openchamber-upstream` and a review PR.
- The watcher never merges or deploys. Merging the PR into `main` triggers the production workflow. The current pin remains `1e74724fc04026e3666f0802a6040f0f24c74226` (2.6.0); at audit time upstream `main` is 18 commits ahead and identifies as 2.6.1.
- Production publishing now uses the official TGCloud full-project push: build, `npx tgcloud fetch`, then one `npx tgcloud push` to publish the configured `dist/` static site and changed `tgcloud/` modules atomically. It does not run migrations or use `--force`.

## Active phase

Phase 2 — Telegram account isolation, pairing and remote runtime verification. Official UI adoption, TGCloud static publication, and Telegram-native QR scanner integration are deployed. Real QR camera flow, pairing-v2 redemption, Private Relay, and live OpenChamber workflow tests still require device verification.

## Completed implementation

- React + TypeScript + Vite host scaffold with Node.js 24.14+ and npm only.
- Pinned recursive OpenChamber mobile UI submodule, upstream browser entry, styles, fonts, assets and runtime.
- Root-level Telegram lifecycle, viewport/theme bridge, safe-area styles and BackButton integration.
- Guarded local Vite transforms that expose upstream pairing-v2 onboarding and route the upstream Scan QR action to Telegram's native QR popup without editing upstream source.
- Telegram native QR popup adapter, upstream payload validation, cancel/abort handling, and manual-link fallback.
- TGCloud static config for root-level `dist/` output.
- Deployment script and GitHub Actions workflow for static Mini App plus scoped `tgcloud/` modules, using Environment secret `ACCESS_TOKEN`.
- No echo handler, bot message handler, custom API proxy, new relay or automated database migration.

## Remaining work

1. Review and merge the account-isolation PR only after CI is green.
2. Let the `main` deployment publish the Serverless schema/endpoints/handler, then manually run **Migrate Telegram Serverless database** from GitHub Actions. Verify the migration job before opening the bot.
3. Reload the Mini App. The owner must pair again once after the legacy origin-wide storage purge. Confirm `/start` renders the RichMessage 10.3 greeting, Terms, Privacy Policy and FAQ.
4. Test two Telegram accounts in the same Telegram client: the owner's account must restore only its own instance; the second account must see a clean onboarding and must not inherit any server session.
5. Test two devices on the same Telegram account: the server-side `instance_id` must remain stable while each device uses its own client credential.
6. Verify Telegram SecureStorage and the compatibility fallback in Telegram clients that do not support it.
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
