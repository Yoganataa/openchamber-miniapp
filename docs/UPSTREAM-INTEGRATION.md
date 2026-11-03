# Upstream OpenChamber UI Integration

## Source of truth

The UI source of truth is the official [openchamber/openchamber](https://github.com/openchamber/openchamber) repository.

This repository pins the upstream source as the `vendor/openchamber` Git submodule at:

- Commit: `1e74724fc04026e3666f0802a6040f0f24c74226`
- Revision: [openchamber/openchamber@1e74724fc04026e3666f0802a6040f0f24c74226](https://github.com/openchamber/openchamber/commit/1e74724fc04026e3666f0802a6040f0f24c74226)
- Upstream application version: `2.6.0`

Do not copy upstream UI files into a separately maintained implementation. Update the submodule pointer deliberately, review the source changes, and keep Telegram-specific integration outside the submodule.

## Runtime entry

The root Vite app uses the official mobile browser entry:

- `packages/web/src/mobile-main.tsx`
- `packages/web/src/runtimeConfig.ts`
- `packages/web/src/api/`
- `packages/ui/src/apps/renderMobileApp.tsx`
- `packages/ui/src/apps/MobileApp.tsx`
- Upstream styles and assets imported by those modules.

The app does not load the desktop `App.tsx` / `MainLayout` shell. The upstream browser entry creates official web RuntimeAPIs and calls the upstream mobile renderer. Vite aliases resolve `@openchamber/ui`, `@web`, `@openchamber/sdk`, and `@` to the pinned source tree.

Local `src/main.tsx` initializes Telegram, configures the public OpenChamber server origin, then imports the upstream browser entry. A narrow Vite transform connects Telegram's BackButton to the same `handleNativeBack` callback the upstream mobile shell uses. The transform checks for the exact upstream hook marker and fails closed if a future upstream revision changes it.

## Typecheck boundary

`npm run typecheck` checks the local Telegram host adapter and Vite integration glue. The upstream source is bundled from the pinned submodule by `npm run build`; it is not re-typechecked using a synthetic Electron/Capacitor environment in this repository. Upstream-only global declarations and native plugin types are not part of the Telegram host's type contract.

Do not fix upstream types by editing files inside `vendor/openchamber`. If the pinned upstream source cannot be bundled, treat that as an integration blocker and either update the upstream pin or make an isolated host compatibility change outside the submodule.

## CORS and hosting boundary

At the pinned revision, OpenChamber Server CORS accepts same-origin browser requests, packaged client origins, and loopback development origins. See the pinned [CORS middleware](https://github.com/openchamber/openchamber/blob/1e74724fc04026e3666f0802a6040f0f24c74226/packages/web/server/index.js) and [origin validation](https://github.com/openchamber/openchamber/blob/1e74724fc04026e3666f0802a6040f0f24c74226/packages/web/server/lib/security/request-security.js).

`OPENCHAMBER_FRAME_ANCESTORS` changes the CSP frame ancestor list only; it does not add arbitrary CORS origins. Production therefore serves the Mini App on the same scheme/host/port as OpenChamber Server, under a path such as `/miniapp/`. See [Deployment](DEPLOYMENT.md).

TGCloud Mini App static hosting uses a separate `app<app_id>.tgcloud.ai` origin, so this project deliberately does not configure the frontend `dist/` directory as a TGCloud static site. TGCloud remains available for optional `tgcloud/` backend modules.

## Telegram-specific boundary

Telegram is the host container, not an OpenChamber authentication mechanism. Local code may handle Telegram lifecycle, viewport, theme events, and BackButton; it must not treat `initDataUnsafe` as proof of identity or authorization. Validate Telegram `initData` on a trusted backend before using Telegram identity for server-side access or account mapping.

OpenChamber Server remains responsible for sessions, OpenCode lifecycle, tools, filesystem, and Git. Electron main/preload code and Capacitor-native project folders are not part of this Telegram WebView.

## Toolchain boundary

The upstream monorepo uses Bun workspaces. This repository remains **Node.js + npm only**:

- Do not run upstream Bun scripts.
- Do not add `bun.lock`, `bun.lockb`, or `packageManager: bun`.
- Resolve UI/runtime dependencies from this repository's root npm manifest and committed `package-lock.json`.
- Keep the submodule source unchanged.

## Clone and update

```bash
git clone --recurse-submodules https://github.com/Yoganataa/openchamber-miniapp.git
```

For an existing checkout:

```bash
git submodule update --init --recursive
```

To upgrade upstream, review the new commit, move the submodule pointer, run `npm ci`, `npm run typecheck`, and `npm run build`, then update this document and `CHECKPOINT.md`.
