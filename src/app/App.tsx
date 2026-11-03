import { useEffect, useState } from 'react';
import { config } from '../lib/config';
import { initializeTelegramWebApp } from '../lib/telegram/client';

export function App() {
  const [telegramAvailable, setTelegramAvailable] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const webApp = initializeTelegramWebApp();
    if (!webApp) return;
    setTelegramAvailable(true);
    setColorScheme(webApp.colorScheme);
  }, []);

  return (
    <main className="app-shell" data-theme={colorScheme}>
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">O</div>
        <div className="brand-copy"><strong>OpenChamber</strong><span>Telegram Mini App</span></div>
        <span className="connection-indicator"><span />Not connected</span>
      </header>
      <section className="welcome-panel">
        <div className="eyebrow">REMOTE DEVELOPMENT WORKSPACE</div>
        <h1>Your coding workspace,<br />inside Telegram.</h1>
        <p className="intro">Connect this Mini App to an OpenChamber Server to access your sessions and development workflows.</p>
        <div className="server-card">
          <div className="server-card-heading"><span className="status-dot" />OpenChamber Server</div>
          <div className="server-url">{config.openChamberServerUrl ?? 'Server URL not configured'}</div>
          <p>{config.openChamberServerUrl ? 'Server address is configured. Pairing and API connectivity are not implemented yet.' : 'Set VITE_OPENCHAMBER_SERVER_URL to configure the public server address.'}</p>
        </div>
        <div className="notice"><span aria-hidden="true">ⓘ</span><p>Initial scaffold only. Telegram identity is not authenticated and no OpenChamber API requests are sent yet.</p></div>
      </section>
      <footer className="app-footer">
        <span>{telegramAvailable ? 'Running inside Telegram' : 'Browser preview'}</span>
        <span>OpenChamber Mini App · {config.environment}</span>
      </footer>
    </main>
  );
}
