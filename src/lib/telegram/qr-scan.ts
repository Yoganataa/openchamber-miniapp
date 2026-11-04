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

const parseScannedPayload = (raw: string): QrScanResult => {
  const value = raw.trim();
  if (!value) return { status: 'invalid' };

  if (/^openchamber:\/\//i.test(value)) {
    const pairing =
      parsePairingConnectionPayload(value) ??
      parsePairingConnectionPayloadString(value);

    return pairing ? { status: 'pairing', pairing } : { status: 'invalid' };
  }

  if (/^https?:\/\//i.test(value)) return { status: 'ok', url: value };
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
        { text: 'Scan an OpenChamber QR code' },
        (text) => {
          if (settled) return true;

          const result = parseScannedPayload(text);
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
