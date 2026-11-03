# Upstream OpenChamber UI Integration

## Source of truth

The UI source of truth is the official [openchamber/openchamber](https://github.com/openchamber/openchamber) repository.

This repository pins the upstream source as the `vendor/openchamber` Git submodule at:

- Commit: `1e74724fc04026e3666f0802a6040f0f24c74226`
- Revision: [openchamber/openchamber@1e74724fc04026e3666f0802a6040f0f24c74226](https://github.com/openchamber/openchamber/commit/1e74724fc04026e3666f0802a6040f0f24c74226)
- Upstream application version at this revision: `2.6.0`

The submodule is intentional: do not copy upstream UI files into a separately maintained implementation. Update the pinned commit deliberately, review the upstream changes, and keep local integration code outside the submodule.

## Required 1:1 surface

Use the official mobile renderer as the Mini App's application surface:

- `packages/ui/src/apps/renderMobileApp.tsx`
- `packages/ui/src/apps/MobileApp.tsx`
- `packages/web/src/mobile-main.tsx`
- `packages/web/mobile.html`
- `packages/web/src/runtimeConfig.ts`
- `packages/web/src/api/`

This is the upstream mobile UI, not the desktop `App.tsx` / `MainLayout`. The mobile renderer already owns the mobile session navigation, chat, workspace drawer, files, changes, settings, and mobile interaction patterns. Prefer it over recreating those components locally.

The official web runtime adapter and API implementation should be reused wherever they are compatible with a browser-hosted Mini App. Keep server API contracts aligned with upstream; do not invent alternate endpoint paths or duplicate the same UI state model.

## Telegram-specific boundary

Telegram is the host container, not an OpenChamber authentication mechanism.

The local Telegram wrapper may handle:

- Telegram WebApp lifecycle and viewport integration.
- Telegram theme and safe-area synchronization.
- Telegram BackButton behavior.
- Secure hand-off to the configured OpenChamber server.

It must not treat `initDataUnsafe` as authentication, expose server credentials in `VITE_*` variables, or infer OpenChamber authorization from Telegram identity. Validate Telegram `initData` on a trusted backend before using Telegram identity for any server-side authorization or account mapping.

## What is deliberately not copied into this Mini App

Do not transplant the entire upstream monorepo as if it were a Telegram runtime:

- OpenChamber Server remains the privileged backend.
- Electron main/preload code is not part of a Telegram WebView.
- Capacitor-native iOS/Android plugins and native project folders are not Telegram capabilities.
- Telegram Serverless is not a replacement for the OpenChamber server or an arbitrary Node.js runtime.

Only the official mobile UI and the browser runtime pieces required to host it should be wired into this repository.

## Toolchain boundary

The upstream monorepo currently declares Bun workspaces and a Bun lockfile. This repository remains **Node.js + npm only**.

- Do not run upstream Bun scripts.
- Do not add `bun.lock`, `bun.lockb`, or `packageManager: bun`.
- Resolve the source package dependencies through this repository's npm manifest.
- Regenerate and commit `package-lock.json` with npm whenever dependencies change.
- Keep the app's Vite build and Telegram deployment configuration owned by this repository.

The source pin is in place, but the upstream renderer is not yet wired into the Vite entry point. Do not describe the Mini App as 1:1 until the renderer is integrated and the production build and Telegram WebView behavior have been verified.

## Clone and update

Clone this repository with its submodule:

```bash
git clone --recurse-submodules https://github.com/Yoganataa/openchamber-miniapp.git
```

For an existing checkout:

```bash
git submodule update --init --recursive
```

To upgrade upstream, review the target OpenChamber commit, move the submodule pointer, run the npm typecheck/build and relevant UI/API tests, then update this document and `CHECKPOINT.md`.
