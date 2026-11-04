declare global {
  interface Window {
    __OPENCHAMBER_RUNTIME_APIS__?: unknown;
    __OPENCHAMBER_API_BASE_URL__?: string;
  }

  const __APP_VERSION__: string;
}

export {};
