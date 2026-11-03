// The upstream browser runtime is resolved and bundled by Vite from the
// pinned Git submodule. Keep it outside this repository's host-adapter tsc
// project so upstream's Electron/Capacitor declarations do not leak into the
// Telegram host type surface.
declare module '@web/mobile-main';
