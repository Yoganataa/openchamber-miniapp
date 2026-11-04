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

const sameJson = (left: unknown, right: unknown): boolean => {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
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
    ? candidate.label.trim()
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
  const sameInstance = isRecord(local)
    && local.id === instance.instanceId
    && sameJson(local.candidates, instance.candidates)
    && (!local.serverId || !instance.serverId || local.serverId === instance.serverId);

  const clientToken = sameInstance && typeof local.clientToken === 'string'
    ? local.clientToken
    : undefined;

  storage.seedConnections([{
    id: instance.instanceId,
    label: instance.label,
    serverId: instance.serverId ?? undefined,
    candidates: instance.candidates,
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
    if (lastError) throw lastError;
    if (persistedRevision < revision) {
      throw new Error('The latest OpenChamber instance update has not been saved.');
    }
  };
};

async function start() {
  window.__OPENCHAMBER_MINIAPP_HOST__ = true;
  const root = document.getElementById('root');
  if (root) root.textContent = 'Verifying Telegram account…';

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
    const developmentStorage = await installTelegramAccountStorage({}, 1);
    reconcileLocalInstance(developmentStorage, null);
    initializeStorageSync(null, developmentStorage);
    await import('@web/mobile-main');
    return;
  }

  if (!telegram.initData?.trim() || !telegram.Serverless?.call) {
    throw new Error('Telegram account verification is unavailable. Open the app from the bot in Telegram.');
  }

  // getMyInstance is an authenticated Telegram Serverless endpoint. Its returned
  // ID is the verified identity used to partition all browser storage.
  const bootstrap = await callTelegramServerless<InstanceBootstrap>(telegram, 'getMyInstance', {});
  if (!Number.isSafeInteger(bootstrap?.telegramUserId) || bootstrap.telegramUserId <= 0) {
    throw new Error('Telegram did not provide a verified account identity.');
  }

  const storage = await installTelegramAccountStorage(telegram, bootstrap.telegramUserId);
  reconcileLocalInstance(storage, bootstrap.instance ?? null);
  initializeStorageSync(telegram, storage);

  // The official mobile renderer and browser RuntimeAPIs remain the UI source
  // of truth. The host adapter isolates its storage and persists ownership
  // before any successful pairing/login transitions into the runtime.
  await import('@web/mobile-main');
}

void start().catch((error: unknown) => {
  console.error('[openchamber-miniapp] startup failed', error);
  const root = document.getElementById('root');
  if (!root) return;
  root.textContent = error instanceof Error
    ? error.message
    : 'OpenChamber Mini App could not start. Reload and try again.';
});
