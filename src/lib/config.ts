const rawServerUrl = import.meta.env.VITE_OPENCHAMBER_SERVER_URL?.trim();

function normalizeServerUrl(value: string | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_OPENCHAMBER_SERVER_URL must be an absolute URL.');
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('OpenChamber Server URL must use HTTPS outside localhost.');
  }
  return url.origin;
}

export const config = {
  environment: import.meta.env.VITE_APP_ENV?.trim() || 'development',
  openChamberServerUrl: normalizeServerUrl(rawServerUrl),
} as const;
