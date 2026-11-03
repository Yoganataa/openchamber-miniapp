import type { Plugin } from 'vite';

const MOBILE_APP_MARKER = '  useNativeAndroidBackButton(handleNativeBack);';
const MOBILE_APP_SUFFIX = '/packages/ui/src/apps/MobileApp.tsx';

export function telegramBackButtonPlugin(): Plugin {
  return {
    name: 'openchamber-telegram-back-button',
    enforce: 'pre',
    transform(code, id) {
      const sourceId = id.split('?')[0].replaceAll('\\', '/');
      if (!sourceId.endsWith(MOBILE_APP_SUFFIX)) return null;

      const occurrences = code.split(MOBILE_APP_MARKER).length - 1;
      if (occurrences !== 1) {
        this.error(
          `Expected one upstream mobile back-handler marker, found ${occurrences}. Review the pinned OpenChamber revision before changing this adapter.`,
        );
      }

      const telegramHandler = `${MOBILE_APP_MARKER}

  // Keep Telegram's native back control on the exact same state ladder as
  // OpenChamber's Capacitor Android back handler.
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

      return {
        code: code.replace(MOBILE_APP_MARKER, telegramHandler),
        map: null,
      };
    },
  };
}
