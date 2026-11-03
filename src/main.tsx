import React from 'react';
import ReactDOM from 'react-dom/client';
import { config } from './lib/config';
import { initializeTelegramWebApp } from './lib/telegram/client';
import './styles/telegram-host.css';

declare global {
  interface Window {
    __OPENCHAMBER_API_BASE_URL__?: string;
  }
}

function showConfigurationError() {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');

  ReactDOM.createRoot(root).render(
    <main className="miniapp-startup-error">
      <section>
        <p className="eyebrow">OPENCHAMBER MINI APP</p>
        <h1>Server URL is not configured</h1>
        <p>
          Build this Mini App with <code>VITE_OPENCHAMBER_SERVER_URL</code> set to
          the public HTTPS URL of your OpenChamber Server.
        </p>
        <p className="muted">
          The official OpenChamber mobile interface will load after its server
          endpoint is configured.
        </p>
      </section>
    </main>,
  );
}

async function start() {
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

  if (!config.openChamberServerUrl) {
    showConfigurationError();
    return;
  }

  window.__OPENCHAMBER_API_BASE_URL__ = config.openChamberServerUrl;

  // Use the upstream mobile entry and runtime adapter unchanged.
  await import('@web/mobile-main');
}

void start().catch((error: unknown) => {
  console.error('[openchamber-miniapp] startup failed', error);
  const root = document.getElementById('root');
  if (!root) return;
  root.textContent = 'OpenChamber could not start. Check the server URL and reload the Mini App.';
});
