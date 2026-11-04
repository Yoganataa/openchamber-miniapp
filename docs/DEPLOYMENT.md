# Deployment

This guide follows Telegram's [official Serverless documentation](https://core.telegram.org/bots/serverless) for Mini App static hosting, CLI authentication, project pushes, and the separation between code deployment and database migrations.

## Hosting model

The Mini App frontend is hosted by **Telegram Serverless static hosting**. The OpenChamber Server remains on the machine you control; Telegram Serverless does not host or replace that server.

TGCloud serves the built frontend at the app URL printed by the CLI, in the form:

`https://app<app_id>.tgcloud.ai/`

The project sets `tgcloud.jsonc` to publish the Vite `dist/` directory. Vite uses the root path (`/`), not `/miniapp/`.

The browser Mini App reaches your OpenChamber instance through the official **pairing v2** flow. Choose **Anywhere** when creating a device pairing so the pairing payload includes the OpenChamber Private Relay transport. The relay is an encrypted transport between your device and your own server; it is not a hosted OpenChamber instance and does not require an inbound port to be opened. The app's HTTP, streaming and WebSocket runtime traffic is carried through the upstream relay tunnel.

Do not add wildcard CORS headers or expose OpenChamber credentials in the Mini App build.

## Build and deploy locally

Use Node.js 24.14+ and npm:

```bash
npm ci
npm run typecheck
npm run build
```

This creates `dist/`. The local deployment script builds the frontend, fetches the latest deployed revision, then publishes the configured static build and scoped Serverless modules in one push:

```bash
npx tgcloud login
npm run deploy
```

`npx tgcloud login` is interactive and saves the CLI Access Token in the ignored local `.tgcloud/` state. Do not commit that directory or paste the token into chat.

For a manual deployment after a successful build:

```bash
npx tgcloud fetch
npx tgcloud push
```

Because `tgcloud.jsonc` configures `static.source` as `dist`, a full `npx tgcloud push` publishes the Mini App files and changed `.js` modules in `tgcloud/` together as one atomic deployment. It does not apply database migrations. Use a targeted push such as `npx tgcloud push dist/` only when you deliberately intend to publish just that part of the project.

## GitHub Actions deployment

The workflow `.github/workflows/deploy-tgcloud.yml` runs on `main` when Mini App source, the pinned upstream submodule, TGCloud config/modules, package manifest/lockfile, or the workflow changes. It also supports manual dispatch, but the deploy job is restricted to `main`.

It runs:

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`
4. `npx tgcloud fetch`
5. `npx tgcloud push`

The deploy job declares GitHub Environment `production` and maps the Environment secret to the variable TGCloud CLI expects:

- Environment: `production`
- Environment secret: `ACCESS_TOKEN`
- Workflow variable: `TGCLOUD_TOKEN`

The secret value must be the Telegram Serverless **CLI Access Token** from BotFather → your bot → Serverless → CLI Access. It is not the Telegram Bot API token. The value is not written to source, frontend files, or the GitHub repository.

Restrict the `production` Environment to deployments from branch `main`. The workflow does not use `--force` and does not run database migrations.

## Configure BotFather

After a successful TGCloud deploy, use the exact static URL printed in the deployment output. Do not guess the app ID or construct a URL manually.

In [@BotFather](https://t.me/BotFather):

- Configure the bot's **Main Mini App** with the deployed TGCloud URL.
- Optionally configure the chat menu button with `/setmenubutton`, using the same URL and a label such as `OpenChamber`.

These are separate launch surfaces. Configure both only if both are wanted.

## Pair the Mini App with your OpenChamber server

The Mini App connects to the OpenChamber instance running on your own machine. It does not need a preconfigured `VITE_OPENCHAMBER_SERVER_URL`.

1. Start your OpenChamber Server and keep it running.
2. In that OpenChamber instance, open **Settings → Remote Instances → Connect to this server → Add a device**.
3. Give the device a recognizable label, choose **Anywhere**, then create the pairing QR/link.
4. Open the Telegram Mini App. Its first screen is the official OpenChamber mobile connection screen.
5. In the Mini App, tap **Scan QR code**. Telegram opens its native QR scanner popup; point it at the QR shown by the OpenChamber host. The Mini App passes the scanned one-time pairing payload to the official upstream redemption flow. If the Telegram client does not expose the scanner API, use the pairing result dialog's **Copy** button beside **Connection link**, then paste the complete `openchamber://connect?...` link into the Mini App's manual connection field. Do not paste a permanent client token or share the one-time link.
6. Wait for the connection flow to complete. The OpenChamber mobile interface then loads through the selected direct or Private Relay transport.

Choose **Anywhere** rather than **Home network only** when the Telegram device must connect from outside the host's LAN. The pairing link is single-use and expires; create a fresh one if it is rejected. Each paired device receives its own client token. Revoke the paired device from OpenChamber's device/remote-instance management if access should be removed.

## Telegram account ownership and credential storage

The Mini App bootstraps through the authenticated `getMyInstance` Serverless endpoint. Telegram validates raw Web App init data before the endpoint runs; the backend reads the owner from `ctx.initData.user.id` and never accepts a user ID from the request body. The SQLite table `telegram_instances` uses `telegram_user_id` as its primary key, so each Telegram account owns at most one canonical OpenChamber instance.

The database stores only instance metadata and transport candidates (direct URL, Private Relay URL, server ID and public relay encryption key). It never stores an OpenChamber password, client token or raw Telegram init data. The canonical instance ID is generated on the server and stays stable when additional devices update the same account mapping.

The browser storage adapter namespaces upstream `localStorage` and `sessionStorage` keys by the verified Telegram user ID. On Telegram clients with SecureStorage support, the active OpenChamber client token is stored through Telegram SecureStorage (Bot API 9.0+); otherwise it remains in the account-scoped WebView namespace. Telegram documents SecureStorage as a per-bot, per-user store with a 10-item limit.

The first startup after this security migration removes origin-wide legacy storage rather than guessing which Telegram account owns it. The current owner must pair again once. This prevents a legacy token from being assigned to the first account that opens the updated Mini App.

### Apply the SQLite migration

TGCloud code/schema deployment and database migrations are separate operations. The normal `npx tgcloud push` deploys `schema.js` but intentionally does not apply the database migration. After the new schema has been deployed to production:

1. Open GitHub Actions → **Migrate Telegram Serverless database**.
2. Run **workflow_dispatch** against `main`.
3. Verify the migration job succeeds before relying on `/start` account status or opening the Mini App.

The migration workflow is manual, restricted to `main`, and uses the `production` Environment's `ACCESS_TOKEN`. Do not run it before the schema module has been deployed. For a local authenticated CLI session, the equivalent command is `npx tgcloud fetch && npx tgcloud migrate`.

Never share a pairing link: it contains a one-time redemption secret. Revoke individual device credentials from the OpenChamber host when a device is no longer trusted. Deleting the Telegram account's instance mapping does not automatically revoke credentials previously issued by that OpenChamber server.

## Runtime verification checklist

- [ ] TGCloud deploy succeeds and prints the static Mini App URL.
- [ ] BotFather Main Mini App and optional menu button use that exact URL.
- [ ] The Mini App opens and displays the upstream connection screen.
- [ ] An **Anywhere** pairing link redeems successfully from Telegram.
- [ ] The connected app reaches the user's OpenChamber instance through Private Relay when direct LAN reachability is unavailable.
- [ ] Sessions, chat streaming, cancellation/reconnect, files, diffs, and WebSocket-backed features work.
- [ ] Telegram BackButton, theme, viewport and keyboard behavior work.
- [ ] Revoking the paired device on the OpenChamber host removes its access.

