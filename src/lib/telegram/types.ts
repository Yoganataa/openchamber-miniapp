export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  initData: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  version: string;
  isVersionAtLeast?(version: string): boolean;
  showScanQrPopup?(params: { text?: string }, callback?: (text: string) => boolean): void;
  closeScanQrPopup?(): void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?(
    event: 'themeChanged' | 'viewportChanged' | 'backButtonClicked' | 'scanQrPopupClosed',
    callback: () => void,
  ): void;
  offEvent?(
    event: 'themeChanged' | 'viewportChanged' | 'backButtonClicked',
    callback: () => void,
  ): void;
  BackButton?: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}
