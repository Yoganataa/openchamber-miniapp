# OpenChamber Mini App

Telegram Mini App client for [OpenChamber](https://github.com/openchamber/openchamber).

## Status

Initial scaffold. This repository is a dedicated Telegram WebApp surface; it does not run OpenCode or replace OpenChamber Server.

## Architecture

- React + TypeScript + Vite frontend.
- Telegram WebApp APIs isolated behind `src/lib/telegram`.
- OpenChamber Server remains the backend for sessions, OpenCode lifecycle, tools, filesystem, and Git operations.
- Telegram Serverless is optional and should only host trusted, narrowly scoped backend operations after its current runtime contract is verified.

## Toolchain

Use **Node.js 24.14+ and npm** consistently for this repository.

Install the exact dependency tree from `package-lock.json` and run the frontend:

```bash
npm ci
npm run dev
npm run typecheck
npm run build
```

Copy `.env.example` to `.env.local` and set `VITE_OPENCHAMBER_SERVER_URL` when connecting to a server.

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

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [ROADMAP.md](ROADMAP.md).
