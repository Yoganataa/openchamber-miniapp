# OpenChamber Mini App

Telegram Mini App that runs the **official OpenChamber mobile UI** from the pinned upstream repository.

## UI source of truth

The app loads upstream `packages/web/src/mobile-main.tsx`, which initializes the official browser runtime and renders `renderMobileApp` / `MobileApp`. Existing OpenChamber screens and workflows are not reimplemented locally.

Upstream is pinned as the recursive Git submodule `vendor/openchamber`. See [Upstream Integration](docs/UPSTREAM-INTEGRATION.md).

## Architecture

- React + TypeScript + Vite host.
- Official OpenChamber mobile renderer, browser RuntimeAPIs, styles, assets and themes.
- Local Telegram host adapter for lifecycle, viewport/theme events and BackButton.
- Official OpenChamber pairing-v2 connection flow and Private Relay transport.
- OpenChamber Server remains on the machine you control and is the privileged runtime for sessions, OpenCode, tools, filesystem and Git.
- Telegram Serverless hosts the static Mini App, verified identity endpoints, the bot `/start` handler, and SQLite ownership records; it does not replace OpenChamber Server.

## Toolchain

Use **Node.js 24.14+ and npm** only.

```bash
git clone --recurse-submodules https://github.com/Yoganataa/openchamber-miniapp.git
cd openchamber-miniapp
npm ci
npm run dev
npm run typecheck
npm run build
```

For an existing checkout:

```bash
git submodule update --init --recursive
```

No OpenChamber server URL or credential is compiled into the frontend. The target server is discovered through the official pairing link when the user connects.

## Production hosting on Telegram

TGCloud static hosting publishes the Vite `dist/` directory at the URL printed by `npx tgcloud push`, normally in this form:

```
https://app<app_id>.tgcloud.ai/
```

The project configures the static build directory in `tgcloud.jsonc`. Deploy the frontend and scoped Serverless modules in one atomic TGCloud push:

```bash
npm run deploy
```

The script builds the Mini App, fetches the latest deployed revision, then runs `npx tgcloud push`. Because `static.source` points to `dist`, that single push publishes the Mini App and changed `tgcloud/*.js` modules together. It does not apply database migrations.

### Automatic upstream updates

GitHub Actions checks the official OpenChamber `main` branch daily. When it advances, the workflow validates the candidate with `npm ci`, `npm run typecheck`, and `npm run build`, then creates or updates a pull request containing only the submodule pointer change. It never auto-merges. Merging the reviewed PR into `main` triggers the production deployment workflow.

### GitHub Environment secret

Create GitHub Environment `production`, allow deployment from branch `main`, and add the **Environment secret** `ACCESS_TOKEN`. Its value is the Telegram Serverless CLI Access Token from BotFather → your bot → Serverless → CLI Access. This is not the Telegram Bot API token.

The deploy job declares `environment: production` and maps `secrets.ACCESS_TOKEN` to the CLI-required environment variable `TGCLOUD_TOKEN`. Never put the token in source, `VITE_*` variables, the lockfile, or chat.

See [Deployment](docs/DEPLOYMENT.md) for the full workflow and setup.

## Connect to your OpenChamber instance

1. Start OpenChamber Server on the computer you control.
2. In that instance, open **Settings → Remote Instances → Connect to this server → Add a device**.
3. Give the device a name, choose **Anywhere**, and create a pairing QR/link.
4. Open this Mini App in Telegram and tap **Scan QR code** to scan the pairing QR from the OpenChamber host. When the Telegram client does not expose the scanner API, paste the complete one-time `openchamber://connect?...` connection link into the manual field. The official pairing flow redeems it and establishes the runtime connection. A fresh pairing link is required after expiry or reuse.

The Telegram Mini App uses Telegram's native QR scanner popup through the official Mini App API; it does not need the native Capacitor plugin or direct camera permission inside the WebView. Tap **Scan QR code** and scan the pairing QR shown by your OpenChamber host. The manual connection field remains available as a fallback on Telegram clients without the scanner API. When pairing from outside your LAN, choose **Anywhere** so the pairing payload can use OpenChamber Private Relay. Relay traffic is end-to-end encrypted between your client and your own OpenChamber instance.

The backend stores exactly one OpenChamber instance mapping per verified Telegram user ID. SQLite enforces this with `telegram_user_id` as its primary key. Client tokens are never sent to SQLite: the Mini App uses Telegram SecureStorage when Bot API 9.0+ support is available, with a per-user WebView storage namespace as the fallback. After this security update, the first startup purges origin-wide legacy state and requires the existing owner to pair again; it never attributes an old token to whichever account opens the app first. Revoke individual device pairings from OpenChamber Server when access is no longer needed. Pairing links are one-time secrets; do not share them.

## Security

- Telegram Serverless validates `initData` before account endpoints run. `ctx.initData.user.id` is the sole SQLite owner key; the frontend cannot choose another user's ID.
- One Telegram account maps to one canonical OpenChamber instance. Device pairing still issues an OpenChamber client credential.
- Telegram identity is not OpenChamber authorization. The pairing-v2 exchange issues the OpenChamber device token.
- Do not use `initDataUnsafe` as proof of identity.
- Do not expose OpenChamber tokens, Telegram bot tokens or CLI Access Tokens in frontend code, URLs, logs or `VITE_*` variables.
- Keep the OpenChamber host updated and revoke paired devices you no longer trust.

See [Architecture](docs/ARCHITECTURE.md), [Upstream Integration](docs/UPSTREAM-INTEGRATION.md), [Deployment](docs/DEPLOYMENT.md) and [Roadmap](ROADMAP.md).
