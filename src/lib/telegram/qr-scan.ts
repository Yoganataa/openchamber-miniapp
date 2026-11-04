import { getTelegramWebApp } from './client';
import {
  parsePairingConnectionPayload,
  parsePairingConnectionPayloadString,
  type PairingConnectionPayload,
} from '../../../vendor/openchamber/packages/ui/src/lib/connectionPayload';

type QrScanResult =
  | { status: 'ok'; url: string; clientToken?: string; label?: string }
  | { status: 'pairing'; pairing: PairingConnectionPayload }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
  | { status: 'invalid' }
  | { status: 'failed' };

const decodeWrappedQrText = (raw: string): string => {
  const value = raw.trim();
  if (/^openchamber:\/\//i.test(value)) return value;

  // Some QR generators wrap deep links as percent-encoded text. Decode once
  // only when the encoded protocol marker is present; never recursively decode.
  if (/openchamber%3a%2f%2f/i.test(value)) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return value;
};

export const parseTelegramQrPayload = (raw: string): QrScanResult => {
  const value = decodeWrappedQrText(raw);
  if (!value) return { status: 'invalid' };

  if (/^openchamber:\/\//i.test(value)) {
    // Prefer the URL-API-free parser: some Telegram Android WebViews parse
    // custom schemes as an empty hostname. The standard parser remains a
    // compatibility fallback for runtime-specific URL behavior.
    const pairing =
      parsePairingConnectionPayloadString(value) ??
      parsePairingConnectionPayload(value);

    return pairing ? { status: 'pairing', pairing } : { status: 'invalid' };
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if ((url.protocol !== 'http:' && url.protocol !== 'https:') ||
        !url.hostname || url.username || url.password) {
        return { status: 'invalid' };
      }
      url.hash = '';
      return { status: 'ok', url: url.toString() };
    } catch {
      return { status: 'invalid' };
    }
  }

  return { status: 'invalid' };
};

export const isTelegramQrScanSupported = (): boolean => {
  const webApp = getTelegramWebApp();
  return Boolean(
    webApp?.showScanQrPopup &&
    webApp.closeScanQrPopup &&
    webApp.onEvent &&
    webApp.offEvent &&
    webApp.isVersionAtLeast?.('7.7'),
  );
};

export const scanTelegramConnectionQr = (
  options?: { signal?: AbortSignal },
): Promise<QrScanResult> => {
  const webApp = getTelegramWebApp();
  if (
    !webApp?.showScanQrPopup ||
    !webApp.closeScanQrPopup ||
    !webApp.onEvent ||
    !webApp.offEvent ||
    !webApp.isVersionAtLeast?.('7.7')
  ) {
    return Promise.resolve({ status: 'unsupported' });
  }

  const showScanQrPopup = webApp.showScanQrPopup.bind(webApp);
  const signal = options?.signal;
  if (signal?.aborted) return Promise.resolve({ status: 'cancelled' });

  return new Promise<QrScanResult>((resolve) => {
    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort);
      webApp.offEvent?.('scanQrPopupClosed', handlePopupClosed);
    };

    const finish = (result: QrScanResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const handlePopupClosed = () => finish({ status: 'cancelled' });
    const handleAbort = () => {
      try {
        webApp.closeScanQrPopup?.();
      } finally {
        finish({ status: 'cancelled' });
      }
    };

    webApp.onEvent?.('scanQrPopupClosed', handlePopupClosed);
    signal?.addEventListener('abort', handleAbort, { once: true });

    try {
      showScanQrPopup(
        { text: 'Scan an OpenChamber pairing QR code' },
        (text) => {
          if (settled) return true;

          const result = parseTelegramQrPayload(text);
          if (result.status === 'invalid') return false;

          finish(result);
          return true;
        },
      );
    } catch {
      finish({ status: 'failed' });
    }
  });
};
