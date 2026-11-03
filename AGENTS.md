# Project Guide

## Purpose
This repository is a Telegram Mini App client for OpenChamber. The frontend is a React + TypeScript + Vite application. OpenChamber Server remains responsible for sessions, OpenCode lifecycle, tools, filesystem, and Git operations. This repository does not replace or embed that server.

## Toolchain
- Node.js >=24.14.0
- npm and the committed package-lock.json
- Install with npm ci; run scripts with npm run <script>.
- Do not introduce Bun or another package manager.

## Runtime boundaries
- Frontend source lives under src/ and may use declared npm dependencies.
- Telegram Serverless code lives only under tgcloud/. It runs in Telegram's isolated V8 runtime, not stock Node.js. It can import the platform SDK (for example sdk, sdk/db) and project modules under tgcloud/, but not arbitrary npm packages or files outside that directory.
- tgcloud.jsonc configures the static Mini App build output (dist).
- .tgcloud/ contains local CLI state and credentials. It is git-ignored; never commit or expose it.

## Security
- Trust Telegram identity only through Telegram Serverless endpoint context ctx.initData after platform verification, or another correctly implemented server-side verification flow.
- Never use frontend initDataUnsafe as authentication proof.
- Never expose bot tokens, CLI Access Tokens, or OpenChamber credentials in frontend code, VITE_* variables, logs, or commits.
- Telegram identity does not itself authorize access to an OpenChamber Server.

## Project status
Read CHECKPOINT.md first, then ROADMAP.md, before continuing implementation. Verify repository and PR state against GitHub; these documents can become stale.
