# OpenChamber Mini App

Telegram Mini App client for [OpenChamber](https://github.com/openchamber/openchamber).

## Status

Initial scaffold. This repository is a dedicated Telegram WebApp surface; it does not run OpenCode or replace OpenChamber Server.

## Architecture

- React + TypeScript + Vite frontend.
- Telegram WebApp APIs isolated behind `src/lib/telegram`.
- OpenChamber Server remains the backend for sessions, OpenCode lifecycle, tools, filesystem, and Git operations.
- Telegram Serverless is optional and should only host trusted, narrowly scoped backend operations after its current runtime contract is verified.

## Development

Requires Bun 1.4.4 and Node.js 24.14+.

```bash
bun install
bun run dev
bun run typecheck
bun run build
```

Copy `.env.example` to `.env.local` and set `VITE_OPENCHAMBER_SERVER_URL` when connecting to a server.

## Security

- Validate Telegram `initData` on a trusted backend. Never authenticate using `initDataUnsafe`.
- Never expose Telegram bot tokens or OpenChamber credentials in frontend code or `VITE_*` variables.
- Require HTTPS in production.
- Telegram identity does not automatically authorize access to an OpenChamber server.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [ROADMAP.md](ROADMAP.md).
