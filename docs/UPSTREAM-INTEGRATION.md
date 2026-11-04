# Upstream OpenChamber UI Integration

## Source of truth

The UI source of truth is the official [openchamber/openchamber](https://github.com/openchamber/openchamber) repository.

This repository pins the upstream source as the `vendor/openchamber` Git submodule at:

- Commit: `1e74724fc04026e3666f0802a6040f0f24c74226`
- Revision: [openchamber/openchamber@1e74724fc04026e3666f0802a6040f0f24c74226](https://github.com/openchamber/openchamber/commit/1e74724fc04026e3666f0802a6040f0f24c74226)
- Upstream application version: `2.6.0`

Do not copy upstream UI files into a separately maintained implementation. Keep the submodule source untouched and place Telegram-specific integration in this repository.

## Runtime entry

The root Vite app uses the official mobile browser entry:

- `packages/web/src/mobile-main.tsx`
- `packages/web/src/runtimeConfig.ts`
- `packages/web/src/api/`
- `packages/ui/src/apps/renderMobileApp.tsx`
- `packages/ui/src/apps/MobileApp.tsx`
- Upstream styles and assets imported by those modules.

Vite aliases resolve `@openchamber/ui`, `@web`, `@openchamber/sdk` and `@` to the pinned source tree. The project does not load the desktop `App.tsx` / `MainLayout` shell.

## Telegram host bridge

Local `src/main.tsx` sets the `__OPENCHAMBER_MINIAPP_HOST__` marker, initializes Telegram WebApp lifecycle, and subscribes to viewport and theme changes. It then imports the upstream browser entry without a fixed API URL; the connected OpenChamber instance is selected through pairing.

`src/vite/telegram-back-button-plugin.ts` applies guarded source transforms outside the submodule:

- Connect Telegram BackButton to the same upstream `handleNativeBack` callback used by the mobile shell.
- Expose the upstream `MobileConnectionWelcome` / pairing screen in the Telegram browser host before a runtime endpoint is selected.
- Bypass the browser password gate for this host only; OpenChamber pairing still has to succeed before the app runtime can initialize.
- Add a short hint that instructs the user to choose Anywhere and paste the copied pairing link.

Every transform requires exactly one upstream marker and fails the Vite build if a future upstream revision changes the expected source. Review this adapter when upgrading the submodule. Do not patch files under `vendor/openchamber`.

## Pairing and Private Relay boundary

The Mini App uses the official pairing-v2 parser and redemption flow from upstream `mobileConnections.ts`. An Anywhere pairing payload may include direct and Private Relay transport candidates. The upstream client establishes a candidate, redeems the one-time pairing secret, stores the issued device token and switches the runtime endpoint.

When the relay candidate is selected, the upstream browser runtime routes HTTP, streaming responses and WebSockets through the end-to-end encrypted relay tunnel. The TGCloud origin is the static frontend origin; it is not treated as the OpenChamber API origin. No wildcard CORS exception or unauthenticated relay is added by this repository.

The browser version stores its client token in WebView local storage. Native Capacitor clients use Keychain/Keystore, but those native secure-storage APIs are not available to this Telegram browser host. Device access must be revoked from the OpenChamber host when no longer trusted.

## Telegram QR scanner adapter

The upstream `mobileQrScan.ts` scanner depends on the native Capacitor BarcodeScanner plugin. The Telegram Mini App host replaces only the scanner import at build time and routes the existing upstream **Scan QR code** action to Telegram's native Mini App scanner API (`showScanQrPopup` / `closeScanQrPopup`). The popup returns the QR text to the local adapter, which validates the pairing-v2 payload with the upstream `connectionPayload.ts` parser. A valid payload is then handed to the existing upstream `redeemPairingConnection` flow; no pairing protocol is reimplemented.

The adapter feature-detects the popup API and the `scanQrPopupClosed` event (Telegram WebApp version 7.7+). Unsupported Telegram clients keep the upstream manual connection field available as a fallback. The scanner does not request raw camera access from the WebView and does not add a QR-decoder dependency.

## Typecheck boundary

`npm run typecheck` checks the local Telegram host adapter and Vite integration glue. The upstream source is bundled from the pinned submodule by `npm run build`; it is not re-typechecked using a synthetic Electron/Capacitor environment in this repository.

Do not fix upstream types by editing files inside `vendor/openchamber`. If the pinned source cannot be bundled, treat it as an integration blocker and make an isolated host compatibility change outside the submodule or deliberately update the upstream pin.

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

To upgrade upstream, review the new commit, move the submodule pointer, run `npm ci`, `npm run typecheck` and `npm run build`, then update this document and `CHECKPOINT.md`.
