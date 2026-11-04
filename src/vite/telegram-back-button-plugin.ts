import type { Plugin } from 'vite';

const MOBILE_APP_MARKER = '  useNativeAndroidBackButton(handleNativeBack);';
const MOBILE_PAIRING_GATE_MARKER =
  '  if (isNativeMobileApp && (!hasRuntimeEndpoint || (!isConnected && !isReconnecting))) {';
const MOBILE_PAIRING_BOOT_GUARD_MARKER =
  '    if (isNativeMobileApp && !getRuntimeApiBaseUrl()) return;';
const MINIAPP_ENTRY_AUTH_MARKER =
  '{isNativeShell ? app : <SessionAuthGate>{app}</SessionAuthGate>}';
const MOBILE_QR_SCAN_IMPORT_MARKER = "import { isQrScanSupported, parseConnectionPayload, scanConnectionQr } from './mobileQrScan';";
const MINIAPP_PAIRING_HINT_MARKER =
  '                  <form className="flex w-full flex-col gap-3 pt-3" onSubmit={handleSubmit}>';

const MOBILE_APP_SUFFIX = '/packages/ui/src/apps/MobileApp.tsx';
const MOBILE_ENTRY_SUFFIX = '/packages/ui/src/apps/renderMobileApp.tsx';
const MOBILE_CONNECTION_SUFFIX = '/packages/ui/src/apps/MobileConnectionWelcome.tsx';
const MOBILE_CONNECTIONS_SUFFIX = '/packages/ui/src/apps/mobileConnections.ts';
const RUNTIME_AUTH_SUFFIX = '/packages/ui/src/lib/runtime-auth.ts';
const RUNTIME_AUTH_COOKIE_MARKER = "credentials: 'include',";

const ACCOUNT_SAVE_MARKERS = [
  "      await persistMetadata({ id: saved?.id, label, candidates, clientToken: token, requestHeaders: headerUpdate });",
  "      await persistMetadata({ label, candidates: deviceCandidates, serverId, clientToken: issuedToken });",
  "          await persistMetadata({ id, label, candidates });",
  "      await persistMetadata({ id, label, candidates, clientToken: issuedToken });",
  "      const next = await persistMetadata({ id: input.id, label, candidates, clientToken, requestHeaders });",
  "      const next = await deleteMobileConnection(id);",
];

const ACCOUNT_COOKIE_MARKER = "credentials: token ? 'omit' : 'include'";
const PASSWORD_COOKIE_MARKER = "credentials: 'include' as const";

const count = (source: string, marker: string): number => source.split(marker).length - 1;

export function telegramBackButtonPlugin(): Plugin {
  return {
    name: 'openchamber-telegram-host-bridge',
    enforce: 'pre',
    transform(code, id) {
      const sourceId = id.split('?')[0].replaceAll('\\', '/');

      if (sourceId.endsWith(MOBILE_APP_SUFFIX)) {
        const backButtonOccurrences = count(code, MOBILE_APP_MARKER);
        if (backButtonOccurrences !== 1) {
          this.error(
            `Expected one upstream mobile back-handler marker, found ${backButtonOccurrences}. Review the pinned OpenChamber revision before changing this adapter.`,
          );
        }

        const pairingGateOccurrences = count(code, MOBILE_PAIRING_GATE_MARKER);
        const pairingGuardOccurrences = count(code, MOBILE_PAIRING_BOOT_GUARD_MARKER);
        if (pairingGateOccurrences !== 1 || pairingGuardOccurrences !== 1) {
          this.error(
            `Expected one upstream native pairing gate and boot guard, found gate=${pairingGateOccurrences}, guard=${pairingGuardOccurrences}. Review the pinned OpenChamber revision before changing this adapter.`,
          );
        }

        const telegramHandler = `${MOBILE_APP_MARKER}

  // Telegram uses the upstream browser runtime, but starts with the same
  // official device-pairing surface as the native mobile app.
  React.useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const backButton = webApp?.BackButton;
    if (!webApp || !backButton) return;

    const onTelegramBack = () => {
      if (!handleNativeBack()) webApp.close();
    };

    backButton.onClick(onTelegramBack);
    backButton.show();
    return () => {
      backButton.offClick?.(onTelegramBack);
      backButton.hide();
    };
  }, [handleNativeBack]);`;

        const withBackButton = code.replace(MOBILE_APP_MARKER, telegramHandler);
        const withPairingGate = withBackButton.replace(
          MOBILE_PAIRING_GATE_MARKER,
          MOBILE_PAIRING_GATE_MARKER.replace(
            'if (isNativeMobileApp &&',
            'if ((isNativeMobileApp || window.__OPENCHAMBER_MINIAPP_HOST__ === true) &&',
          ),
        );
        const withBootGuard = withPairingGate.replace(
          MOBILE_PAIRING_BOOT_GUARD_MARKER,
          MOBILE_PAIRING_BOOT_GUARD_MARKER.replace(
            'if (isNativeMobileApp &&',
            'if ((isNativeMobileApp || window.__OPENCHAMBER_MINIAPP_HOST__ === true) &&',
          ),
        );

        return {code:withBootGuard,map:null};
      }

      if (sourceId.endsWith(MOBILE_ENTRY_SUFFIX)) {
        const occurrences = count(code, MINIAPP_ENTRY_AUTH_MARKER);
        if (occurrences !== 1) {
          this.error(
            `Expected one upstream browser auth wrapper, found ${occurrences}. Review the pinned OpenChamber revision before changing this adapter.`,
          );
        }
        return {
          code:code.replace(
            MINIAPP_ENTRY_AUTH_MARKER,
            '{isNativeShell || window.__OPENCHAMBER_MINIAPP_HOST__ === true ? app : <SessionAuthGate>{app}</SessionAuthGate>}',
          ),
          map:null,
        };
      }

      if (sourceId.endsWith(MOBILE_CONNECTIONS_SUFFIX)) {
        for (const marker of ACCOUNT_SAVE_MARKERS) {
          const occurrences = count(code, marker);
          if (occurrences !== 1) {
            this.error(`Expected one upstream account-isolation marker, found ${occurrences}: ${marker}`);
          }
        }

        const cookieOccurrences = count(code, ACCOUNT_COOKIE_MARKER);
        const passwordCookieOccurrences = count(code, PASSWORD_COOKIE_MARKER);
        if (cookieOccurrences !== 2 || passwordCookieOccurrences !== 1) {
          this.error(
            `Expected two tokenless-session cookie guards and one password-login cookie guard, found session=${cookieOccurrences}, password=${passwordCookieOccurrences}.`,
          );
        }

        let transformed = code;
        for (const marker of ACCOUNT_SAVE_MARKERS) {
          const indentation = marker.match(/^\s*/)?.[0] ?? '';
          transformed = transformed.replace(
            marker,
            `${marker}\n${indentation}await window.__OPENCHAMBER_SYNC_INSTANCE__?.();`,
          );
        }

        transformed = transformed.replaceAll(
          ACCOUNT_COOKIE_MARKER,
          "credentials: token || window.__OPENCHAMBER_MINIAPP_HOST__ === true ? 'omit' : 'include'",
        );
        transformed = transformed.replace(
          PASSWORD_COOKIE_MARKER,
          "credentials: window.__OPENCHAMBER_MINIAPP_HOST__ === true ? 'omit' as const : 'include' as const",
        );

        return { code: transformed, map: null };
      }

      if (sourceId.endsWith(RUNTIME_AUTH_SUFFIX)) {
        const cookieOccurrences = count(code, RUNTIME_AUTH_COOKIE_MARKER);
        if (cookieOccurrences !== 2) {
          this.error(
            `Expected two upstream runtime-auth cookie credential markers, found ${cookieOccurrences}. Review the pinned OpenChamber revision before changing this adapter.`,
          );
        }

        return {
          code: code.replaceAll(
            RUNTIME_AUTH_COOKIE_MARKER,
            "credentials: window.__OPENCHAMBER_MINIAPP_HOST__ === true ? 'omit' : 'include',",
          ),
          map: null,
        };
      }

      if (sourceId.endsWith(MOBILE_CONNECTION_SUFFIX)) {
        const importOccurrences = count(code, MOBILE_QR_SCAN_IMPORT_MARKER);
        const formOccurrences = count(code, MINIAPP_PAIRING_HINT_MARKER);
        if (importOccurrences !== 1 || formOccurrences !== 1) {
          this.error(
            `Expected one upstream QR scanner import and manual-connection form, found import=${importOccurrences}, form=${formOccurrences}. Review the pinned OpenChamber revision before changing this adapter.`,
          );
        }

        const telegramQrImports = `import { parseConnectionPayload } from './mobileQrScan';
import { isTelegramQrScanSupported as isQrScanSupported, scanTelegramConnectionQr as scanConnectionQr } from '/src/lib/telegram/qr-scan';`;
        const hostHint = `                  {window.__OPENCHAMBER_MINIAPP_HOST__ === true ? (
                    <p className="px-1 text-center typography-small text-muted-foreground">
                      Choose Anywhere on the OpenChamber host, then scan its pairing QR code here.
                    </p>
                  ) : null}
`;

        return {
          code: code
            .replace(MOBILE_QR_SCAN_IMPORT_MARKER, telegramQrImports)
            .replace(MINIAPP_PAIRING_HINT_MARKER, hostHint + MINIAPP_PAIRING_HINT_MARKER),
          map: null,
        };
      }

      return null;
    },
  };
}
