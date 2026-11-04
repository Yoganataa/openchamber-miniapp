const MAX_LABEL_LENGTH = 80;
const MAX_CANDIDATES = 12;
const MAX_URL_LENGTH = 2048;
const SENSITIVE_QUERY_PARAMETER =
  /(?:access[_-]?token|token|api[_-]?key|secret|password|credential|authorization|^auth$|^grant$|^sig(?:nature)?$|^jwt$)/i;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const boundedString = (value, maxLength) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;

const normalizeLabel = (value) => {
  if (typeof value !== 'string') return null;
  const label = value.trim();
  return label ? label.slice(0, MAX_LABEL_LENGTH) : null;
};

const parseUrl = (value, protocols, { allowQuery = false } = {}) => {
  if (!boundedString(value, MAX_URL_LENGTH)) return null;

  try {
    const parsed = new URL(value);
    if (!protocols.includes(parsed.protocol)) return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;

    // OpenChamber's pairing-v2 parser preserves harmless relay query parameters
    // but strips URL fragments. Keep that contract while refusing query keys
    // that could turn a transport URL into a credential store.
    if (parsed.search) {
      if (!allowQuery) return null;
      for (const key of parsed.searchParams.keys()) {
        if (SENSITIVE_QUERY_PARAMETER.test(key)) return null;
      }
    }
    parsed.hash = '';
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

  const relayUrl = parseUrl(candidate.relay.relayUrl, ['ws:', 'wss:'], { allowQuery: true });
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

  // The upstream pairing label is operator-controlled. Bound it here instead
  // of rejecting an otherwise valid pairing just because the label is long.
  const label = normalizeLabel(input.label);
  if (!label) return null;

  const candidates = input.candidates.map((candidate) => {
    if (candidate?.kind === 'direct') return normalizeDirectCandidate(candidate);
    if (candidate?.kind === 'relay') return normalizeRelayCandidate(candidate);
    return null;
  });

  if (candidates.some((candidate) => candidate === null)) return null;

  const providedServerId = boundedString(input.serverId, 128);
  const relayServerId = candidates.find((candidate) => candidate.kind === 'relay')?.relay.serverId ?? null;

  // A direct /health identity and the relay's pinned server identity must
  // describe the same OpenChamber host. Reject inconsistent metadata rather
  // than persisting a mapping that could later match the wrong device token.
  if (providedServerId && relayServerId && providedServerId !== relayServerId) return null;

  const serverId = providedServerId || relayServerId;

  return { serverId, label, candidates };
};
