# OpenChamber Mini App

Telegram Mini App client that runs the **official OpenChamber mobile UI**, sourced directly from the pinned upstream repository.

## UI source of truth

The app loads upstream `packages/web/src/mobile-main.tsx`, which initializes the official browser runtime and calls `renderMobileApp` / `MobileApp`. The upstream mobile UI is not reimplemented locally.

Upstream is pinned as the `vendor/openchamber` Git submodule. See [Upstream Integration](docs/UPSTREAM-INTEGRATION.md) for the pinned commit and integration boundaries.

## Architecture

- React + TypeScript + Vite host.
- Official OpenChamber mobile renderer, browser API implementation, and styles from the pinned submodule.
- Local Telegram adapter for lifecycle, viewport/theme events, and Telegram BackButton integration.
- OpenChamber Server remains the privileged runtime for sessions, OpenCode, tools, filesystem, and Git.
- Telegram Serverless is retained for optional trusted backend modules; it does not replace OpenChamber Server.

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

For an existing clone:

```bash
git submodule update --init --recursive
```

Set `VITE_OPENCHAMBER_SERVER_URL` to the public HTTPS origin of your OpenChamber Server. This is a public URL, not a credential. Never put tokens, passwords, or bot credentials in `VITE_*` variables.

## Production hosting

The pinned OpenChamber Server allows same-origin browser calls and a narrow set of packaged client origins; it does not provide a general Telegram Mini App CORS allowlist. TGCloud static hosting serves a Mini App at `https://app<app_id>.tgcloud.ai/`, a different origin from an independently hosted OpenChamber Server. Do not use the TGCloud static hostname for this frontend and expect upstream API, pairing, streaming, and WebSocket calls to work cross-origin.

Serve the Mini App on the **same scheme, hostname, and port** as OpenChamber Server under a path such as `/miniapp/`. Set `VITE_OPENCHAMBER_SERVER_URL` to that same origin and build with:

```bash
npm run build:miniapp:same-origin
```

This sets Vite's base to `/miniapp/`. Deploy the resulting `dist/` contents to the static path on the same host, then set the Telegram Mini App URL in BotFather to:

```
https://openchamber.example.com/miniapp/
```

Replace the example hostname with your actual public origin. See [Deployment](docs/DEPLOYMENT.md) for the reverse-proxy layout and CSP considerations.

## BotFather setup

After deploying the frontend at the same-origin `/miniapp/` URL, configure the bot in [@BotFather](https://t.me/BotFather):

- For the profile's **Launch app** entry, use `/mybots → select bot → Bot Settings → Configure Mini App` and enable/configure the Main Mini App URL.
- For a persistent chat entry point, use `/setmenubutton` (or **Bot Settings → Menu Button**), set a label such as `OpenChamber`, and enter the same URL.
- The Main Mini App also supports a direct link in the form `https://t.me/<bot_username>?startapp`.

Both launch surfaces must point to the same-origin URL, for example `https://openchamber.example.com/miniapp/`. See [Deployment](docs/DEPLOYMENT.md#configure-the-telegram-bot) for the launch smoke-test checklist and security boundary.

## Telegram Serverless

The `tgcloud/` directory is for optional trusted backend modules. `npm run deploy` first fetches the current cloud revision, then pushes only tracked `tgcloud/` modules. It does not upload the frontend to TGCloud's separate static hostname.

GitHub Actions automatically deploys backend-module changes after they reach `main`. Create the GitHub Environment `production` and add an **Environment secret** named `ACCESS_TOKEN` containing the CLI Access Token from BotFather → your bot → Serverless → CLI Access. This is **not** the Telegram Bot API token. The deploy job declares `environment: production` and maps `secrets.ACCESS_TOKEN` to the CLI-required `TGCLOUD_TOKEN`, validates the Mini App build, fetches the remote deployment state, and then pushes `tgcloud/`. It never runs database migrations automatically. Restrict the environment's deployment branches to `main`. See [Deployment](docs/DEPLOYMENT.md#github-environment-and-secret) for setup steps.

```bash
npm create @tgcloud/bot .
npx tgcloud login
npx tgcloud status
npx tgcloud diff
npm run deploy
```

Enter the CLI Access Token only in the local CLI prompt. Do not paste it into chat or commit it. The `.tgcloud/` directory is git-ignored.

## Security

- Never authenticate using Telegram `initDataUnsafe`.
- Validate Telegram `initData` on a trusted backend before using Telegram identity for authorization or account mapping.
- OpenChamber authentication/pairing remains independently required.
- Do not expose OpenChamber tokens, Telegram bot tokens, or CLI Access Tokens in frontend code, URLs, logs, or `VITE_*` variables.
- Use HTTPS in production.

See [Architecture](docs/ARCHITECTURE.md), [Upstream Integration](docs/UPSTREAM-INTEGRATION.md), [Deployment](docs/DEPLOYMENT.md), and [Roadmap](ROADMAP.md).
