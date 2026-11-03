# OpenChamber Mini App

Telegram Mini App client for [OpenChamber](https://github.com/openchamber/openchamber).

## Product direction

The client UI must stay 1:1 with OpenChamber's official mobile surface. The upstream repository is pinned under `vendor/openchamber`; use its mobile renderer instead of implementing a parallel UI. See [Upstream UI Integration](docs/UPSTREAM-INTEGRATION.md) for the source pin and integration boundaries.

The source is pinned, but the official renderer has not yet replaced the initial local scaffold. The Mini App is not yet feature-complete.

## Architecture

- React + TypeScript + Vite frontend hosted as a Telegram Mini App.
- The official OpenChamber mobile UI is the UI source of truth.
- Telegram WebApp APIs remain isolated behind a local host adapter.
- OpenChamber Server remains the privileged backend for sessions, OpenCode lifecycle, tools, filesystem, and Git operations.
- Telegram Serverless may host trusted, narrowly scoped backend operations only after its runtime and authorization contract is verified.

## Toolchain

Use **Node.js 24.14+ and npm** consistently for this repository.

Clone with the pinned upstream source:

```bash
git clone --recurse-submodules https://github.com/Yoganataa/openchamber-miniapp.git
cd openchamber-miniapp
npm ci
npm run dev
npm run typecheck
npm run build
```

For an existing checkout, initialize the submodule before working:

```bash
git submodule update --init --recursive
```

Copy `.env.example` to `.env.local` and set `VITE_OPENCHAMBER_SERVER_URL` when connecting to a server. Do not put access tokens, bot tokens, or passwords in `VITE_*` variables.

## Telegram Serverless setup

From the repository root, initialize the official Telegram Serverless scaffold in the existing project:

```bash
npm create @tgcloud/bot .
npx tgcloud login
npx tgcloud status
npx tgcloud diff
```

Enter the CLI Access Token only in the local CLI prompt. Do not paste it into chat or commit it. The `.tgcloud/` directory is git-ignored.

## Security

- Validate Telegram `initData` on a trusted backend. Never authenticate using `initDataUnsafe`.
- Never expose Telegram bot tokens or OpenChamber credentials in frontend code or `VITE_*` variables.
- Require HTTPS in production.
- Telegram identity does not automatically authorize access to an OpenChamber server.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md), [UPSTREAM-INTEGRATION.md](docs/UPSTREAM-INTEGRATION.md), and [ROADMAP.md](ROADMAP.md).
