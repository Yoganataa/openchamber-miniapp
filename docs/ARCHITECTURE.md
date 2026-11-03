# Architecture

## Goal
Provide an OpenChamber remote client inside Telegram. The Mini App is a presentation and interaction surface. OpenChamber Server remains responsible for sessions, OpenCode lifecycle, tools, filesystem operations, Git operations, and other privileged capabilities.

## Runtime topology

```text
Telegram client
  └─ Telegram Mini App (React / WebView)
       ├─ Telegram WebApp adapter
       ├─ OpenChamber API client
       └─ responsive UI
             │ HTTPS / authenticated API
             ▼
       OpenChamber Server
         └─ OpenCode runtime and project resources

Optional trusted backend:
Telegram Mini App
  └─ Telegram Serverless endpoint
       ├─ verify Telegram initData
       ├─ enforce access policy
       └─ narrowly scoped relay / identity mapping
             │ HTTPS
             ▼
       OpenChamber Server
```

## Responsibilities

### Mini App
- Render the mobile client.
- Use Telegram theme, viewport, safe-area, and navigation APIs through an adapter.
- Connect to a paired OpenChamber Server.
- Keep transient UI state client-side.
- Never contain privileged credentials.

### OpenChamber Server
- Source of truth for sessions and project state.
- Owns OpenCode process lifecycle and privileged tools.
- Enforces authorization for every operation.
- Provides streaming and cancellation semantics.

### Optional Telegram Serverless backend
Use only where a trusted server boundary is required, such as validating Telegram launch data or mapping Telegram identity to an explicitly authorized OpenChamber account.

It must not become an unrestricted proxy. Each route requires explicit authorization, request validation, rate limiting, and allowlisted upstream operations.

## Authentication
Telegram launch data (`initData`) is signed. The frontend may submit it to a trusted backend, but Telegram identity must only be trusted after server-side validation using Telegram's documented procedure and a bot token held as a server-side secret.

Do not use `initDataUnsafe` as authentication proof. Do not put bot tokens, OpenChamber tokens, or upstream credentials in `VITE_*` variables.

Telegram identity does not automatically grant access to an OpenChamber instance. OpenChamber server authentication remains independently required.

## API integration strategy
1. Audit the current public OpenChamber server API and authentication contract.
2. Add a typed client only for supported endpoints.
3. Preserve streaming, cancellation, retry, and error semantics.
4. Avoid private monorepo paths until shared packages expose stable public exports.
5. Add contract tests before claiming feature parity.

## WebView constraints
The Mini App is a web application inside Telegram's WebView. It does not inherit native filesystem, process, shell, or arbitrary background execution access. Features requiring those capabilities must be delegated to OpenChamber Server or shown as unavailable.

## Deployment
The frontend can be hosted on HTTPS static hosting. Telegram Serverless hosting is optional and must be evaluated against its actual runtime, access, quota, and deployment requirements before becoming a production dependency.
