import type { Plugin } from 'vite';

const MOBILE_APP_MARKER = '  useNativeAndroidBackButton(handleNativeBack);';
const MOBILE_PAIRING_GATE_MARKER =
  '  if (isNativeMobileApp && (!hasRuntimeEndpoint || (!isConnected && !isReconnecting))) {';
const MOBILE_PAIRING_BOOT_GUARD_MARKER =
  '    if (isNativeMobileApp && !getRuntimeApiBaseUrl()) return;';
const MINIAPP_ENTRY_AUTH_MARKER =
  '{isNativeShell ? app : <SessionAuthGate>{app}</SessionAuthGate>}';
const MINIAPP_PAIRING_HINT_MARKER =
  '                  <form className="flex w-full flex-col gap-3 pt-3" onSubmit={handleSubmit}>';

const MOBILE_APP_SUFFIX = '/packages/ui/src/apps/MobileApp.tsx';
const MOBILE_ENTRY_SUFFIX = '/packages/ui/src/apps/renderMobileApp.tsx';
const MOBILE_CONNECTION_SUFFIX = '/packages/ui/src/apps/MobileConnectionWelcome.tsx';

const count = (source: string, marker: string): number => source.split(marker).length - 1;

export function telegramBackButtonPlugin(): Plugin {
  return {
    name: 'openchamber-telegram-host-bridge',
    enforce: 'pre',
    transform(code, id) {
      const sourceId = id.split('?')[0].replaceAll('\\\\', '/');

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

      if (sourceId.endsWith(MOBILE_CONNECTION_SUFFIX)) {
        const occurrences = count(code, MINIAPP_PAIRING_HINT_MARKER);
        if (occurrences !== 1) {
          this.error(
            `Expected one upstream mobile manual-connection form, found ${occurrences}. Review the pinned OpenChamber revision before changing this adapter.`,
          );
        }
        const hint = `                  {window.__OPENCHAMBER_MINIAPP_HOST__ === true ? (
                    <p className="px-1 text-center typography-small text-muted-foreground">
                      Choose Anywhere when creating the pairing link, then paste the copied OpenChamber link here.
                    </p>
                  ) : null}
`;
        return {
          code:code.replace(MINIAPP_PAIRING_HINT_MARKER, hint + MINIAPP_PAIRING_HINT_MARKER),
          map:null,
        };
      }

      return null;
    },
  };
}
