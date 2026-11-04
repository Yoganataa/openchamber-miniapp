export const MOBILE_CONNECTIONS_STORAGE_KEY = 'openchamber.mobile.connections.v1';

const SECURE_TOKENS_KEY = 'openchamber_mobile_tokens_v1';
const DEVICE_ID_STORAGE_KEY = 'openchamber.mobile.deviceId';
const STORAGE_PREFIX = 'openchamber.telegram-user.';
const SECURE_STORAGE_TIMEOUT_MS = 4000;

type TelegramSecureStorage = {
  getItem(
    key: string,
    callback: (error: Error | null, value?: string | null, canRestore?: boolean) => void,
  ): unknown;
  setItem(
    key: string,
    value: string,
    callback?: (error: Error | null, saved?: boolean) => void,
  ): unknown;
  removeItem(
    key: string,
    callback?: (error: Error | null, removed?: boolean) => void,
  ): unknown;
};

export type TelegramStorageHost = {
  version?: string;
  isVersionAtLeast?(version: string): boolean;
  SecureStorage?: TelegramSecureStorage;
};

export type AccountScopedStorage = {
  enableConnectionSync(callback: (connections: unknown[]) => void): void;
  seedConnections(connections: unknown[]): void;
  replaceLocalConnections(connections: unknown[]): void;
  readConnections(): unknown[];
  flushCredentials(): Promise<void>;
};

const parseJsonArray = (value: string | null): unknown[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseSecureTokenMap = (value: string | null): Record<string, string> => {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, token]) =>
        /^[a-zA-Z0-9_-]{16,64}$/.test(key)
        && typeof token === 'string'
        && token.trim().length > 0,
      ),
    );
  } catch {
    return {};
  }
};

const secureStorageFor = (host: TelegramStorageHost): TelegramSecureStorage | null => {
  const secure = host.SecureStorage;
  if (!secure || typeof secure.getItem !== 'function'
    || typeof secure.setItem !== 'function' || typeof secure.removeItem !== 'function') return null;

  if (typeof host.isVersionAtLeast === 'function' && !host.isVersionAtLeast('9.0')) return null;
  return secure;
};

const invokeSecureStorage = <T,>(
  invoke: (callback: (error: Error | null, value?: T) => void) => unknown,
): Promise<T> => new Promise((resolve, reject) => {
  let settled = false;
  const timeoutId = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    reject(new Error('Telegram SecureStorage request timed out'));
  }, SECURE_STORAGE_TIMEOUT_MS);

  const finish = (error: Error | null, value?: T) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeoutId);
    if (error) reject(error);
    else resolve(value as T);
  };

  try {
    invoke(finish);
  } catch (error) {
    finish(error instanceof Error ? error : new Error(String(error)));
  }
});

const createScopedStorage = (
  target: Storage,
  prefix: string,
  onConnectionsWrite: (value: string) => void,
  getConnectionsValue: (raw: string | null) => string | null,
): Storage => {
  const scopedKeys = (): string[] => {
    const keys: string[] = [];
    for (let index = 0; index < target.length; index += 1) {
      const key = target.key(index);
      if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
    }
    return keys;
  };

  const storage = new Proxy(target, {
    get(store, property) {
      if (property === 'length') return scopedKeys().length;
      if (property === 'getItem') {
        return (key: string) => {
          const normalized = String(key);
          const raw = store.getItem(prefix + normalized);
          return normalized === MOBILE_CONNECTIONS_STORAGE_KEY ? getConnectionsValue(raw) : raw;
        };
      }
      if (property === 'setItem') {
        return (key: string, value: string) => {
          const normalized = String(key);
          const raw = String(value);
          if (normalized === MOBILE_CONNECTIONS_STORAGE_KEY) {
            onConnectionsWrite(raw);
            return;
          }
          store.setItem(prefix + normalized, raw);
        };
      }
      if (property === 'removeItem') {
        return (key: string) => {
          const normalized = String(key);
          store.removeItem(prefix + normalized);
          if (normalized === MOBILE_CONNECTIONS_STORAGE_KEY) onConnectionsWrite('[]');
        };
      }
      if (property === 'clear') {
        return () => {
          for (const key of scopedKeys()) store.removeItem(prefix + key);
          onConnectionsWrite('[]');
        };
      }
      if (property === 'key') {
        return (index: number) => scopedKeys()[index] ?? null;
      }
      if (typeof property === 'string') {
        const raw = store.getItem(prefix + property);
        return raw === null ? undefined : raw;
      }
      return Reflect.get(store, property, store);
    },
    set(store, property, value) {
      if (typeof property !== 'string') return Reflect.set(store, property, value, store);
      if (property === 'length') return false;
      if (property === MOBILE_CONNECTIONS_STORAGE_KEY) {
        onConnectionsWrite(String(value));
        return true;
      }
      store.setItem(prefix + property, String(value));
      return true;
    },
    deleteProperty(store, property) {
      if (typeof property !== 'string') return false;
      store.removeItem(prefix + property);
      if (property === MOBILE_CONNECTIONS_STORAGE_KEY) onConnectionsWrite('[]');
      return true;
    },
    has(_store, property) {
      if (typeof property !== 'string') return false;
      return scopedKeys().includes(property);
    },
    ownKeys() {
      return scopedKeys();
    },
    getOwnPropertyDescriptor(_store, property) {
      if (typeof property !== 'string' || !scopedKeys().includes(property)) return undefined;
      const raw = target.getItem(prefix + property);
      return {
        configurable: true,
        enumerable: true,
        writable: true,
        value: raw ?? undefined,
      };
    },
  });

  return storage as Storage;
};

const removeLegacyOriginKeys = (storage: Storage, prefix: string): void => {
  const legacyKeys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && !key.startsWith(prefix)) legacyKeys.push(key);
  }
  for (const key of legacyKeys) storage.removeItem(key);
};

const replaceStorage = (property: 'localStorage' | 'sessionStorage', storage: Storage): void => {
  Object.defineProperty(window, property, {
    configurable: true,
    enumerable: true,
    get: () => storage,
  });
};

export const installTelegramAccountStorage = async (
  host: TelegramStorageHost,
  verifiedTelegramUserId: number,
): Promise<AccountScopedStorage> => {
  if (!Number.isSafeInteger(verifiedTelegramUserId) || verifiedTelegramUserId <= 0) {
    throw new Error('A verified Telegram user ID is required before storage initialization.');
  }

  const prefix = `${STORAGE_PREFIX}${verifiedTelegramUserId}.`;
  const baseLocalStorage = window.localStorage;
  const baseSessionStorage = window.sessionStorage;
  // Remove origin-wide state left by versions that did not partition Telegram
  // accounts. Never attribute those legacy tokens or session caches to the
  // first Telegram account that happens to open the upgraded Mini App.
  removeLegacyOriginKeys(baseLocalStorage, STORAGE_PREFIX);
  removeLegacyOriginKeys(baseSessionStorage, STORAGE_PREFIX);

  const secure = secureStorageFor(host);
  let secureStorageEnabled = Boolean(secure);
  let secureTokens: Record<string, string> = {};
  let credentialWrite = Promise.resolve();

  // The upstream pairing flow already uses this ID as its device dedupe key.
  // Reuse it so each Telegram account/device receives a separate OpenChamber
  // token while SecureStorage consumes only one item per Telegram user.
  let deviceId = baseLocalStorage.getItem(prefix + DEVICE_ID_STORAGE_KEY);
  if (!deviceId || !/^[a-zA-Z0-9_-]{16,64}$/.test(deviceId)) {
    deviceId = crypto.randomUUID();
    baseLocalStorage.setItem(prefix + DEVICE_ID_STORAGE_KEY, deviceId);
  }
  let connectionSync: ((connections: unknown[]) => void) | null = null;
  let syncEnabled = false;

  if (secure) {
    try {
      const value = await invokeSecureStorage<string | null>((callback) => {
        secure.getItem(SECURE_TOKENS_KEY, callback);
      });
      secureTokens = parseSecureTokenMap(value);
    } catch {
      // Some Telegram clients expose the API surface but do not implement it.
      // Fall back to the Telegram-account-scoped WebView storage in that case.
      secureStorageEnabled = false;
    }
  }

  const persistCredentials = (): void => {
    if (!secure || !secureStorageEnabled) return;
    credentialWrite = credentialWrite.catch(() => undefined).then(async () => {
      if (Object.keys(secureTokens).length > 0) {
        const saved = await invokeSecureStorage<boolean>((callback) => {
          secure.setItem(SECURE_TOKENS_KEY, JSON.stringify(secureTokens), callback);
        });
        if (saved === false) throw new Error('Telegram SecureStorage rejected the OpenChamber device-token map.');
      } else {
        const removed = await invokeSecureStorage<boolean>((callback) => {
          secure.removeItem(SECURE_TOKENS_KEY, callback);
        });
        if (removed === false) throw new Error('Telegram SecureStorage did not remove the OpenChamber device-token map.');
      }
    });
  };

  const writeConnectionValue = (value: string): void => {
    const entries = parseJsonArray(value).filter(isRecord).slice(0, 1);
    const first = entries[0];
    const token = typeof first?.clientToken === 'string' && first.clientToken.trim()
      ? first.clientToken.trim()
      : null;

    if (secureStorageEnabled) {
      const nextTokens = { ...secureTokens };
      if (token) nextTokens[deviceId] = token;
      else delete nextTokens[deviceId];
      secureTokens = nextTokens;
      persistCredentials();
      if (first) {
        const { clientToken: _clientToken, ...metadata } = first;
        void _clientToken;
        baseLocalStorage.setItem(prefix + MOBILE_CONNECTIONS_STORAGE_KEY, JSON.stringify([metadata]));
      } else {
        baseLocalStorage.setItem(prefix + MOBILE_CONNECTIONS_STORAGE_KEY, '[]');
      }
    } else {
      baseLocalStorage.setItem(prefix + MOBILE_CONNECTIONS_STORAGE_KEY, JSON.stringify(entries));
    }

    if (syncEnabled && connectionSync) {
      const metadata = entries.map((entry) => {
        const { clientToken: _clientToken, ...safeEntry } = entry;
        void _clientToken;
        return safeEntry;
      });
      connectionSync(metadata);
    }
  };

  const readConnectionValue = (raw: string | null): string | null => {
    const entries = parseJsonArray(raw).filter(isRecord).slice(0, 1);
    const secureToken = secureTokens[deviceId];
    if (!secureStorageEnabled || !entries[0] || !secureToken) return raw;
    return JSON.stringify([{ ...entries[0], clientToken: secureToken }]);
  };

  const onConnectionsWrite = (value: string) => writeConnectionValue(value);
  const localStorage = createScopedStorage(baseLocalStorage, prefix, onConnectionsWrite, readConnectionValue);
  const sessionStorage = createScopedStorage(baseSessionStorage, prefix, () => undefined, (raw) => raw);

  replaceStorage('localStorage', localStorage);
  replaceStorage('sessionStorage', sessionStorage);

  return {
    enableConnectionSync(callback) {
      connectionSync = callback;
      syncEnabled = true;
    },
    seedConnections(connections) {
      const wasEnabled = syncEnabled;
      syncEnabled = false;
      try {
        writeConnectionValue(JSON.stringify(connections.slice(0, 1)));
      } finally {
        syncEnabled = wasEnabled;
      }
    },
    replaceLocalConnections(connections) {
      const wasEnabled = syncEnabled;
      syncEnabled = false;
      try {
        writeConnectionValue(JSON.stringify(connections.slice(0, 1)));
      } finally {
        syncEnabled = wasEnabled;
      }
    },
    readConnections() {
      return parseJsonArray(localStorage.getItem(MOBILE_CONNECTIONS_STORAGE_KEY));
    },
    async flushCredentials() {
      await credentialWrite;
    },
  };
};
