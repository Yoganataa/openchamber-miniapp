export interface TelegramSecureStorage {
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
}

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
  Serverless?: {
    call(
      name: string,
      input: Record<string, unknown>,
      callback: (error: (Error & { type?: string; parameters?: Record<string, unknown> }) | null, result?: unknown) => void,
    ): void;
  };
  SecureStorage?: TelegramSecureStorage;
  showScanQrPopup?(params: { text?: string }, callback?: (text: string) => boolean): void;
  closeScanQrPopup?(): void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?(
    event: 'themeChanged' | 'viewportChanged' | 'backButtonClicked' | 'scanQrPopupClosed',
    callback: () => void,
  ): void;
  offEvent?(
    event: 'themeChanged' | 'viewportChanged' | 'backButtonClicked' | 'scanQrPopupClosed',
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
    __OPENCHAMBER_MINIAPP_HOST__?: boolean;
    __OPENCHAMBER_SYNC_INSTANCE__?: () => Promise<void>;
  }
}
