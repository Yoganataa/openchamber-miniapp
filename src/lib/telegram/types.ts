export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  initData: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  version: string;
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?(
    event: 'themeChanged' | 'viewportChanged' | 'backButtonClicked',
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
