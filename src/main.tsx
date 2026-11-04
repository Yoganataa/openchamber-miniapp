import { installTelegramAccountStorage, type AccountScopedStorage } from './lib/telegram/account-storage';
import { callTelegramServerless, initializeTelegramWebApp } from './lib/telegram/client';
import type { TelegramWebApp } from './lib/telegram/types';
import './styles/telegram-host.css';

type InstanceRecord = {
  instanceId: string;
  serverId: string | null;
  label: string;
  candidates: unknown[];
};

type InstanceBootstrap = {
  telegramUserId: number;
  instance: InstanceRecord | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const setStartupStatus = (title: string, description: string): void => {
  const root = document.getElementById('root');
  if (!root) return;
  const titleElement = root.querySelector<HTMLElement>('[data-startup-title]');
  const descriptionElement = root.querySelector<HTMLElement>('[data-startup-description]');
  if (titleElement) titleElement.textContent = title;
  if (descriptionElement) descriptionElement.textContent = description;
};

const renderStartupError = (error: unknown): void => {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <main class="miniapp-startup-error" role="alert">
      <section class="miniapp-startup-error__card">
        <div class="miniapp-startup-error__icon" aria-hidden="true">!</div>
        <p class="miniapp-startup-error__eyebrow">OPENCHAMBER MINI APP</p>
        <h1>Could not open your workspace</h1>
        <p class="miniapp-startup-error__message" data-startup-error-message></p>
        <button class="miniapp-startup-error__retry" type="button" data-startup-retry>Try again</button>
        <p class="miniapp-startup-error__hint">Your account data is kept separate. Reload the Mini App to retry verification.</p>
      </section>
    </main>
  `;

  const message = error instanceof Error
    ? error.message
    : 'OpenChamber Mini App could not start. Reload and try again.';
  const messageElement = root.querySelector<HTMLElement>('[data-startup-error-message]');
  if (messageElement) messageElement.textContent = message;
  root.querySelector<HTMLButtonElement>('[data-startup-retry]')
    ?.addEventListener('click', () => window.location.reload());
  root.setAttribute('aria-busy', 'false');
};

const candidateIdentityKeys = (candidates: unknown): Set<string> => {
  if (!Array.isArray(candidates)) return new Set();
  const keys = new Set<string>();

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    if (candidate.kind === 'direct' && typeof candidate.url === 'string') {
      keys.add(`direct:${candidate.url.replace(/\/$/, '')}`);
    }
    if (candidate.kind === 'relay' && isRecord(candidate.relay)
      && typeof candidate.relay.serverId === 'string') {
      keys.add(`relay:${candidate.relay.serverId}`);
    }
  }

  return keys;
};

const isSameInstance = (local: unknown, instance: InstanceRecord): local is Record<string, unknown> => {
  if (!isRecord(local)) return false;

  const localServerId = typeof local.serverId === 'string' ? local.serverId : null;
  const remoteServerId = typeof instance.serverId === 'string' ? instance.serverId : null;

  // Server identity outranks transport addresses. If both sides know it, a
  // mismatch is definitive even when a LAN address was later reassigned.
  if (localServerId && remoteServerId) return localServerId === remoteServerId;

  const localKeys = candidateIdentityKeys(local.candidates);
  const remoteKeys = candidateIdentityKeys(instance.candidates);
  const sharedRelayIdentity = [...localKeys].some(
    (key) => key.startsWith('relay:') && remoteKeys.has(key),
  );
  if (sharedRelayIdentity) return true;

  // The canonical ID is persisted after the Serverless write. Keeping this
  // fallback also covers instances whose older host revision has no server ID.
  if (local.id === instance.instanceId) return true;

  // Do not fall back to a direct URL when only one side knows the server ID:
  // the address could have been reassigned to another OpenChamber host.
  if (localServerId || remoteServerId) return false;

  // Recovery for a browser interrupted after the server commit but before the
  // canonical ID was copied into its local metadata.
  return [...localKeys].some((key) => remoteKeys.has(key));
};

const persistInstanceSnapshot = async (
  telegram: TelegramWebApp,
  storage: AccountScopedStorage,
  records: unknown[],
): Promise<void> => {
  const candidate = records[0];
  if (!isRecord(candidate) || !Array.isArray(candidate.candidates) || candidate.candidates.length === 0) {
    await callTelegramServerless(telegram, 'deleteMyInstance', {});
    return;
  }

  const label = typeof candidate.label === 'string' && candidate.label.trim()
    ? candidate.label.trim().slice(0, 80)
    : 'OpenChamber Server';

  const result = await callTelegramServerless<{ saved: boolean; instanceId: string }>(telegram, 'saveMyInstance', {
    serverId: typeof candidate.serverId === 'string' ? candidate.serverId : undefined,
    label,
    candidates: candidate.candidates,
  });

  if (!result?.saved || typeof result.instanceId !== 'string' || !result.instanceId) {
    throw new Error('The Telegram account instance mapping could not be saved.');
  }

  // Keep the server-issued canonical ID in each device's local record without
  // emitting another sync operation. This makes a second device converge on the
  // same one-instance mapping instead of replacing its primary identity.
  const local = storage.readConnections()[0];
  if (isRecord(local) && local.id !== result.instanceId) {
    storage.replaceLocalConnections([{ ...local, id: result.instanceId }]);
  }
};

const reconcileLocalInstance = (
  storage: AccountScopedStorage,
  instance: InstanceRecord | null,
): void => {
  if (!instance) {
    // This deliberately discards legacy origin-wide connection state. It must
    // never be silently attributed to whichever Telegram account opens first.
    storage.seedConnections([]);
    return;
  }

  const local = storage.readConnections()[0];
  const sameInstance = isSameInstance(local, instance);
  const clientToken = sameInstance && typeof local.clientToken === 'string'
    ? local.clientToken
    : undefined;

  storage.seedConnections([{
    id: instance.instanceId,
    label: sameInstance && typeof local.label === 'string' ? local.label : instance.label,
    serverId: instance.serverId ?? (sameInstance && typeof local.serverId === 'string' ? local.serverId : undefined),
    // Candidate addresses are device-local (LAN routes differ by network).
    // Keep a matching device's candidates while the canonical server identity
    // remains the same; a new device seeds from the server-side metadata.
    candidates: sameInstance && Array.isArray(local.candidates) ? local.candidates : instance.candidates,
    lastUsedAt: sameInstance && typeof local.lastUsedAt === 'number' ? local.lastUsedAt : Date.now(),
    ...(clientToken ? { clientToken } : {}),
  }]);
};

const initializeStorageSync = (
  telegram: TelegramWebApp | null,
  storage: AccountScopedStorage,
): void => {
  if (!telegram?.Serverless?.call) {
    storage.enableConnectionSync(() => undefined);
    window.__OPENCHAMBER_SYNC_INSTANCE__ = () => storage.flushCredentials();
    return;
  }

  let revision = 0;
  let persistedRevision = 0;
  let lastError: unknown;
  let syncQueue: Promise<void> = Promise.resolve();

  storage.enableConnectionSync((records) => {
    const scheduledRevision = ++revision;
    // Every write is serialized. The endpoint accepts only metadata and derives
    // its owner from verified initData, never from fields supplied by the UI.
    syncQueue = syncQueue
      .catch(() => undefined)
      .then(async () => {
        await persistInstanceSnapshot(telegram, storage, records);
        persistedRevision = Math.max(persistedRevision, scheduledRevision);
        lastError = undefined;
      })
      .catch((error: unknown) => {
        lastError = error;
      });
  });

  window.__OPENCHAMBER_SYNC_INSTANCE__ = async () => {
    await storage.flushCredentials();
    await syncQueue;
    if (lastError) {
      console.error('[openchamber-miniapp] Telegram instance sync failed', lastError);
      const detail = lastError instanceof Error ? lastError.message : String(lastError);
      throw new Error(`[telegram-instance-sync] ${detail}`);
    }
    if (persistedRevision < revision) {
      throw new Error('[telegram-instance-sync] The latest OpenChamber instance update has not been saved.');
    }
  };
};

async function start() {
  window.__OPENCHAMBER_MINIAPP_HOST__ = true;
  setStartupStatus(
    'Verifying your Telegram account',
    'Checking your Telegram session and permissions.',
  );

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

  if (!telegram) {
    if (!import.meta.env.DEV) {
      throw new Error('Open this Mini App from its Telegram bot.');
    }
    setStartupStatus('Preparing development preview', 'Starting the OpenChamber mobile interface.');
    const developmentStorage = await installTelegramAccountStorage({}, 1);
    reconcileLocalInstance(developmentStorage, null);
    initializeStorageSync(null, developmentStorage);
    await import('@web/mobile-main');
    return;
  }

  if (!telegram.initData?.trim() || !telegram.Serverless?.call) {
    throw new Error('Telegram account verification is unavailable. Open the app from the bot in Telegram.');
  }

  setStartupStatus('Loading your account', 'Retrieving the connection settings for this Telegram account.');

  // getMyInstance is an authenticated Telegram Serverless endpoint. Its returned
  // ID is the verified identity used to partition all browser storage.
  const bootstrap = await callTelegramServerless<InstanceBootstrap>(telegram, 'getMyInstance', {});
  if (!Number.isSafeInteger(bootstrap?.telegramUserId) || bootstrap.telegramUserId <= 0) {
    throw new Error('Telegram did not provide a verified account identity.');
  }

  setStartupStatus('Preparing your workspace', 'Setting up private storage for this Telegram account.');
  const storage = await installTelegramAccountStorage(telegram, bootstrap.telegramUserId);
  reconcileLocalInstance(storage, bootstrap.instance ?? null);
  initializeStorageSync(telegram, storage);

  setStartupStatus('Opening OpenChamber', 'Loading the official mobile workspace.');
  // The official mobile renderer and browser RuntimeAPIs remain the UI source
  // of truth. The host adapter isolates its storage and persists ownership
  // before any successful pairing/login transitions into the runtime.
  await import('@web/mobile-main');
}

void start().catch((error: unknown) => {
  console.error('[openchamber-miniapp] startup failed', error);
  renderStartupError(error);
});
