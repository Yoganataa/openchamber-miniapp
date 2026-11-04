const MAX_LABEL_LENGTH = 80;
const MAX_CANDIDATES = 12;
const MAX_URL_LENGTH = 2048;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const boundedString = (value, maxLength) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;

const parseUrl = (value, protocols) => {
  if (!boundedString(value, MAX_URL_LENGTH)) return null;

  try {
    const parsed = new URL(value);
    if (!protocols.includes(parsed.protocol)) return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;
    if (parsed.search || parsed.hash) return null;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const normalizeDirectCandidate = (candidate) => {
  if (!isRecord(candidate) || candidate.kind !== 'direct') return null;
  const url = parseUrl(candidate.url, ['http:', 'https:']);
  return url ? { kind: 'direct', url } : null;
};

const normalizeRelayCandidate = (candidate) => {
  if (!isRecord(candidate) || candidate.kind !== 'relay' || !isRecord(candidate.relay)) return null;

  const relayUrl = parseUrl(candidate.relay.relayUrl, ['ws:', 'wss:']);
  const serverId = boundedString(candidate.relay.serverId, 128);
  const jwk = candidate.relay.hostEncPubJwk;

  if (!relayUrl || !serverId || !isRecord(jwk)) return null;
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') return null;

  const x = boundedString(jwk.x, 256);
  const y = boundedString(jwk.y, 256);
  if (!x || !y) return null;

  return {
    kind: 'relay',
    relay: {
      relayUrl,
      serverId,
      hostEncPubJwk: { kty: 'EC', crv: 'P-256', x, y },
    },
  };
};

export const normalizeInstanceInput = (input) => {
  if (!isRecord(input) || !Array.isArray(input.candidates)) return null;
  if (input.candidates.length < 1 || input.candidates.length > MAX_CANDIDATES) return null;

  const label = boundedString(input.label, MAX_LABEL_LENGTH);
  if (!label) return null;

  const candidates = input.candidates.map((candidate) => {
    if (candidate?.kind === 'direct') return normalizeDirectCandidate(candidate);
    if (candidate?.kind === 'relay') return normalizeRelayCandidate(candidate);
    return null;
  });

  if (candidates.some((candidate) => candidate === null)) return null;

  const serverId = boundedString(input.serverId, 128)
    || candidates.find((candidate) => candidate.kind === 'relay')?.relay.serverId
    || null;

  return { serverId, label, candidates };
};
