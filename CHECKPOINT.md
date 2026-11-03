# Checkpoint

Last audited: 2026-11-04
Repository: https://github.com/Yoganataa/openchamber-miniapp
Default branch: main

## Current state
- Working branch: main; no other branch was returned by GitHub branch search.
- Pull requests: no open PRs and no PR records returned for this repository.
- Latest audited implementation commit before this checkpoint refresh: 3999d4daef6fc84c21d43c8ee36f71b8645645c6 (docs: clarify Mini App and Telegram runtime boundaries). Earlier commits in this audit added CI (1f361ff47d816e1c6249216de735b73dc639c7c8), the checkpoint (28c0c6dad41911936bc675e30b55a6177f9ff76e), and roadmap reconciliation (67c38e948d8df12fe8795636adbf7588bc35aa3b).
- Toolchain: Node.js >=24.14.0 + npm. package-lock.json is lockfile v3 and its root dependency declarations match package.json.
- GitHub Actions workflow .github/workflows/ci.yml now runs npm ci, npm run typecheck, and npm run build on pushes and pull requests targeting main. The available GitHub status query returned no check statuses for the audited head; the workflow result is therefore unverified.
- No successful local or remote typecheck/build result has been established in this audit.

## Phase status
Active phase: Phase 0 — Foundation (verification outstanding).

Completed and present:
- React + TypeScript + Vite application scaffold.
- Telegram WebApp adapter with browser fallback.
- Initial Telegram ready(), expand(), and color-scheme read.
- Public environment configuration and HTTPS URL validation.
- Responsive shell with CSS safe-area insets.
- Telegram Serverless scaffold: tgcloud.jsonc, tgcloud/handlers/message.js, tgcloud/schema.js, AGENTS.md, and docs/tgcloud-sdk.md.
- npm scripts for development, typecheck, build, and build-then-deploy.

Still outstanding:
- Confirm GitHub Actions CI passes npm ci, npm run typecheck, and npm run build.
- Phase 1 navigation, live theme synchronization, BotFather launch documentation, and real Telegram-client testing.
- Phase 2 OpenChamber API/authentication audit and connectivity implementation.
- Telegram Serverless login, linked-bot status, endpoint implementation, and deployment have not been verified.

## Important implementation notes
- tgcloud.jsonc publishes Vite's dist directory as the Mini App static site.
- Telegram Serverless modules execute in Telegram's isolated runtime, not ordinary Node.js. Only the platform SDK and project modules under tgcloud/ are available there; do not import frontend code or arbitrary npm packages into those modules.
- tgcloud/handlers/message.js is currently the scaffold echo handler. Review/replace it before production deployment; do not treat it as final bot behavior.
- No application endpoint under tgcloud/endpoints/ has been confirmed present.
- .tgcloud/ is git-ignored local CLI state. Never request, expose, or commit CLI credentials. The CLI Access Token previously pasted into chat must be treated as compromised and revoked; authenticate only in the user's local CLI prompt with a newly issued token.
- OpenChamber Server remains the privileged backend. The Mini App is only a client; Telegram identity does not automatically authorize access to an OpenChamber instance.

## Next actions
1. Check the first CI run triggered by the new workflow and fix any actual failure before advancing Phase 0.
2. Once CI is green, mark Phase 0 complete and begin Phase 1's remaining Telegram lifecycle/navigation work.
3. Before implementing Phase 2, inspect upstream OpenChamber's current public API and authentication contract; do not guess endpoint shapes.
4. Verify the user's local npx tgcloud status output before any deployment or schema migration.

## Working rules
- Use Node.js and npm only. Use npm ci for reproducible installs.
- Do not reintroduce Bun or a second lockfile.
- Audit current repository and PR state before each continuation.
- Do not repeat completed work or claim tests/deployment that have not run.
- Update this file and ROADMAP.md whenever phase status or a material implementation decision changes.
- Keep secrets out of chat, source control, logs, and frontend environment variables.
