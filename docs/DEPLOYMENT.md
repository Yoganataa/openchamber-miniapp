# Deployment

## Required origin layout

At the pinned upstream revision, OpenChamber Server CORS accepts same-origin browser requests plus a narrow set of packaged client and loopback development origins. It does not provide a general Telegram Mini App CORS allowlist. TGCloud static hosting serves a Mini App at `https://app<app_id>.tgcloud.ai/`, separate from an independently hosted OpenChamber Server. This origin is not compatible with the upstream browser API without changing upstream server origin policy.

`OPENCHAMBER_FRAME_ANCESTORS` configures which pages may frame the server's UI; it does not change CORS. Do not add `Access-Control-Allow-Origin: *` or introduce an unauthenticated API relay to bypass this restriction.

Serve the Mini App on the same **scheme, hostname, and port** as OpenChamber Server under a path such as `/miniapp/`. Example:

- Server/API origin: `https://openchamber.example.com`
- Mini App URL: `https://openchamber.example.com/miniapp/`
- Build API origin: `https://openchamber.example.com`

Keep normal `/api/` routes and WebSocket upgrades on that same host.

## Build

Set the public server origin in `.env.local` or the build environment:

```dotenv
VITE_OPENCHAMBER_SERVER_URL=https://openchamber.example.com
```

Then build for `/miniapp/`:

```bash
npm ci
npm run build:miniapp:same-origin
```

The script sets Vite's base to `/miniapp/` and runs the host typecheck plus Vite build. Copy the contents of `dist/` to the static directory mounted at `/miniapp/`. For example, copy `dist/` into `/srv/openchamber/miniapp/`.

Set the Telegram Mini App URL in BotFather to the same-origin URL. The URL path must match the Vite base path.

## Nginx static path example

This assumes `dist/` was copied to `/srv/openchamber/miniapp/`. Keep the existing OpenChamber `/api/` reverse-proxy and WebSocket configuration in place; this block only serves static Mini App files.

```nginx
location ^~ /miniapp/ {
    root /srv/openchamber;
    try_files $uri $uri/ /miniapp/index.html;

    # Keep Telegram Web frame ancestors narrow and verify the origins used
    # by the Telegram clients you support.
    add_header Content-Security-Policy "frame-ancestors 'self' https://web.telegram.org" always;
}
```

Do not use `*` in `frame-ancestors`. This CSP header is for the static Mini App document; do not overwrite CSP on OpenChamber API routes. Set a no-cache policy for `/miniapp/index.html` and long-lived immutable caching for hashed `/miniapp/assets/*` if your deployment already manages cache headers.

## Configure the Telegram bot

The Mini App must be deployed at the same-origin URL described above before registering it with Telegram. Use the exact public URL, including the `/miniapp/` path and trailing slash.

### Main Mini App

1. Open [@BotFather](https://t.me/BotFather) and send `/mybots`.
2. Select the bot, then open **Bot Settings → Configure Mini App** and enable/configure its Main Mini App.
3. Set the Main Mini App URL to your deployed URL, for example `https://openchamber.example.com/miniapp/`.
4. Save the configuration. Telegram adds a **Launch app** entry to the bot profile when a Main Mini App is configured.

### Chat menu button

1. In [@BotFather](https://t.me/BotFather), send `/setmenubutton` and select the bot.
2. Set the button label (for example, `OpenChamber`) and use the same deployed `/miniapp/` URL.
3. Alternatively, use **Bot Settings → Menu Button**.

The Main Mini App and chat menu button are separate launch surfaces; configure both only when both entry points are desired. A Main Mini App can also be opened using a direct link such as `https://t.me/<bot_username>?startapp`. Telegram forwards a supplied `startapp` value as launch data; this project does not currently define app-specific handling for that value.

### Launch smoke test

- Open the app from the bot profile and from the chat menu button.
- Confirm the loaded URL stays on the OpenChamber Server's exact scheme, hostname, and port.
- Confirm the upstream pairing/login flow, API requests, streaming, and WebSocket connection work.
- Confirm Telegram BackButton behavior and viewport/theme changes; repeat on Android, iOS, Desktop, and Telegram Web.

Do not treat Telegram-provided user data as OpenChamber authorization. The normal OpenChamber authentication/pairing flow remains required. Validate Telegram `initData` on a trusted backend before using it for any identity mapping or authorization.

References: [Telegram Mini Apps](https://core.telegram.org/bots/webapps) and [Bot API changelog](https://core.telegram.org/bots/api-changelog).

## Telegram Serverless backend deployment

The repository's `tgcloud.jsonc` intentionally does not configure a static Mini App folder. The frontend is hosted beside OpenChamber Server to satisfy upstream CORS policy. The GitHub Actions deploy workflow **does not publish the frontend** to TGCloud's separate static hostname.

The optional Telegram Serverless backend modules live under `tgcloud/`. Local deployment:

```bash
npm ci
npx tgcloud login
npm run deploy
```

The local deploy script runs `npx tgcloud fetch` first, then `npx tgcloud push tgcloud/`. Fetching first updates the CLI's view of the deployed revision. The targeted push deploys changes under `tgcloud/` without overwriting unrelated remote modules. It does not use `--force`.

### GitHub Actions auto-deploy

### GitHub Environment and secret

The deployment job explicitly targets the GitHub Environment named `main`. Store the Telegram Serverless **CLI Access Token** as an **Environment secret** in that environment, not as an environment variable:

- Environment name: `main`
- Secret name: `TGCLOUD_TOKEN`
- Secret value: the Telegram Serverless CLI Access Token from BotFather → your bot → Serverless → CLI Access.

In GitHub, open **Settings → Environments → main → Environment secrets → Add secret**. The workflow references it as `secrets.TGCLOUD_TOKEN`; environment secrets are only made available to jobs that declare the matching `environment`. Do not paste the value into the repository, a workflow file, or chat.

For a production-only target, set **Deployment branches and tags** to **Selected branches and tags**, then allow the branch `main`. The workflow itself also gates the deployment job to `refs/heads/main`, so manual dispatch from another branch will not deploy. If the environment has required reviewers or a wait timer, the job will wait for those protection rules before the secret becomes available.

`.github/workflows/deploy-tgcloud.yml` runs only on `main` when backend source/configuration, the npm manifest/lockfile, or the deployment workflow changes. It also supports manual dispatch, but the job is restricted to `main`.

Create an **Environment secret** with this exact name in the GitHub Environment `main`:

```text
TGCLOUD_TOKEN
```

Its value must be the **Telegram Serverless CLI Access Token** from BotFather → your bot → Serverless → CLI Access → Access token. This is distinct from the Telegram Bot API token. The CLI reads `TGCLOUD_TOKEN` directly in CI and does not write the value into `.tgcloud/credentials` or the repository. The workflow passes it only to the deployment step.

Before pushing, the workflow runs `npm ci`, `npm run typecheck`, and `npm run build:miniapp:same-origin`. The deploy step then runs:

```bash
npx tgcloud fetch
npx tgcloud push tgcloud/
```

TGCloud's optimistic revision check prevents a stale CI run from silently overwriting a deployment made elsewhere. The workflow does not use `--force`.

**Database migrations are not automatic.** TGCloud `push` registers schema changes but never applies them. Review any proposed migration and run `npx tgcloud migrate` deliberately when an actual schema change is introduced.

The starter `tgcloud/handlers/message.js` echo handler has been removed. No chat message handler is currently active, so deploying this project will not unexpectedly echo users' messages. Add a real `/start` or message handler only when its intended product behavior is implemented.

## Verification checklist

- [ ] The Telegram Mini App URL and OpenChamber API origin have identical scheme, hostname, and port.
- [ ] `/miniapp/` returns the built Vite `index.html` and all `/miniapp/assets/*` resolve.
- [ ] OpenChamber API calls succeed through the upstream pairing/authentication flow.
- [ ] Chat streaming and WebSocket upgrades succeed through the same-origin reverse proxy.
- [ ] Telegram Web embedding works with a narrowly scoped CSP `frame-ancestors` policy.
- [ ] Telegram Android, iOS, Desktop, and Telegram Web are tested separately.
- [ ] The repository Actions secret is named `TGCLOUD_TOKEN` and the first main-branch TGCloud deployment succeeds.
- [ ] Check `npx tgcloud webhook` after changing the deployed handlers; run `npx tgcloud webhook sync` only when the reported state is out of sync and the change is intended.
