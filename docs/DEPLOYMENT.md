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

The script sets `VITE_BASE_PATH=/miniapp/` and runs the normal typecheck plus Vite build. Copy the contents of `dist/` to the static directory mounted at `/miniapp/`. For example, copy `dist/` into `/srv/openchamber/miniapp/`.

Set the Telegram Mini App URL in BotFather to the same-origin URL. The URL path must match the Vite base path.

## Nginx static path example

This assumes `dist/` was copied to `/srv/openchamber/miniapp/`. Keep the existing OpenChamber `/api/` reverse-proxy and WebSocket configuration in place; this block only serves static Mini App files.

```nginx
location ^~ /miniapp/ {
    root /srv/openchamber;
    try_files $uri $uri/ /miniapp/index.html;

    # Telegram Web embeds Mini Apps in a web container. Keep this list narrow
    # and include the actual Telegram Web parent origin used by your clients.
    add_header Content-Security-Policy "frame-ancestors 'self' https://web.telegram.org" always;
}
```

If your Telegram Web client uses another official parent origin, add that exact origin after verifying it. Do not use `*`. This CSP header is for the static Mini App document; do not overwrite CSP on the OpenChamber API routes.

Set a no-cache policy for `/miniapp/index.html` and long-lived immutable caching for hashed `/miniapp/assets/*` if your deployment already manages cache headers.

## Telegram Serverless

The repository's `tgcloud.jsonc` intentionally does not configure a static Mini App folder. The frontend is deployed beside OpenChamber Server to satisfy upstream origin policy.

Optional Telegram Serverless modules remain under `tgcloud/`. Deploy only those modules with:

```bash
npm run deploy
```

That command targets `tgcloud/` only; it does not upload the frontend to TGCloud static hosting. Keep the scaffold echo handler out of production until it has been reviewed and replaced.

## Verification checklist

- [ ] The Telegram Mini App URL and OpenChamber API origin have identical scheme, hostname, and port.
- [ ] `/miniapp/` returns the built Vite `index.html` and all `/miniapp/assets/*` resolve.
- [ ] OpenChamber API calls succeed through the upstream pairing/authentication flow.
- [ ] Chat streaming and WebSocket upgrades succeed through the same-origin reverse proxy.
- [ ] Telegram Web embedding works with a narrowly scoped CSP `frame-ancestors` policy.
- [ ] Telegram Android, iOS, Desktop, and Telegram Web are tested separately.
