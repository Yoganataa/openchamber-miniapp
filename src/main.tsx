import { initializeTelegramWebApp } from './lib/telegram/client';
import './styles/telegram-host.css';

declare global {
  interface Window {
    __OPENCHAMBER_MINIAPP_HOST__?: boolean;
  }
}

async function start() {
  // This host uses the upstream pairing-v2 flow. The selected OpenChamber
  // instance is discovered from the user's one-time pairing link, not a
  // build-time server URL.
  window.__OPENCHAMBER_MINIAPP_HOST__ = true;

  const telegram = initializeTelegramWebApp();

  if (telegram) {
    const updateViewport = () => {
      const height = telegram.viewportHeight || window.visualViewport?.height || window.innerHeight;
      const stableHeight = telegram.viewportStableHeight || height;
      document.documentElement.style.setProperty('--oc-telegram-viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--oc-telegram-viewport-stable-height', `${stableHeight}px`);
    };

    updateViewport();
    telegram.onEvent?.('viewportChanged', updateViewport);
    telegram.onEvent?.('themeChanged', () => {
      document.documentElement.style.colorScheme = telegram.colorScheme;
    });
    telegram.BackButton?.hide();
  }

  // The official mobile renderer and browser RuntimeAPIs remain the UI source
  // of truth. A local Vite transform exposes its pairing screen in this host.
  await import('@web/mobile-main');
}

void start().catch((error: unknown) => {
  console.error('[openchamber-miniapp] startup failed', error);
  const root = document.getElementById('root');
  if (!root) return;
  root.textContent = 'OpenChamber Mini App could not start. Reload and try again.';
});
