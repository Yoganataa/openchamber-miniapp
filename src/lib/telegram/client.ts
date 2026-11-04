import type { TelegramWebApp } from './types';

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function initializeTelegramWebApp(): TelegramWebApp | null {
  const webApp = getTelegramWebApp();
  if (!webApp) return null;
  webApp.ready();
  webApp.expand();
  return webApp;
}

export function callTelegramServerless<T>(
  webApp: TelegramWebApp,
  endpoint: string,
  input: Record<string, unknown> = {},
): Promise<T> {
  if (!webApp.Serverless?.call) {
    return Promise.reject(new Error('Telegram Serverless is unavailable in this Mini App context.'));
  }

  return new Promise((resolve, reject) => {
    webApp.Serverless?.call(endpoint, input, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result as T);
    });
  });
}
