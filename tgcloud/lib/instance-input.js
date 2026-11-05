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

const parseUrl = (value, protocols, { allowQuery = false, preserveTrailingSlash = false } = {}) => {
  if (!boundedString(value, MAX_URL_LENGTH)) return null;

  try {
    const parsed = new URL(value);
    if (!protocols.includes(parsed.protocol)) return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;

    if (parsed.search) {
      if (!allowQuery) return null;
      for (const key of parsed.searchParams.keys()) {
        if (SENSITIVE_QUERY_PARAMETER.test(key)) return null;
      }
    }
    parsed.hash = '';
    const normalized = parsed.toString();
    return preserveTrailingSlash ? normalized : normalized.replace(/\/+$/g, '');
  } catch {
    return null;
  }
};

const validateCandidate = (candidate) => {
  if (!isRecord(candidate)) return { normalized: null, reason: 'candidate-not-object' };

  if (candidate.kind === 'direct') {
    const url = parseUrl(candidate.url, ['http:', 'https:'], { allowQuery: true });
    return url
      ? { normalized: { kind: 'direct', url }, reason: null }
      : { normalized: null, reason: 'direct-url-invalid-or-contains-credentials' };
  }

  if (candidate.kind === 'relay') {
    if (!isRecord(candidate.relay)) return { normalized: null, reason: 'relay-config-missing' };
    const relayUrl = parseUrl(candidate.relay.relayUrl, ['ws:', 'wss:'], {
      allowQuery: true,
      preserveTrailingSlash: true,
    });
    if (!relayUrl) return { normalized: null, reason: 'relay-url-invalid-or-contains-credentials' };

    const serverId = boundedString(candidate.relay.serverId, 128);
    if (!serverId) return { normalized: null, reason: 'relay-server-identity-invalid' };

    const jwk = candidate.relay.hostEncPubJwk;
    if (!isRecord(jwk) || jwk.kty !== 'EC' || jwk.crv !== 'P-256') {
      return { normalized: null, reason: 'relay-public-key-algorithm-invalid' };
    }
    const x = boundedString(jwk.x, 256);
    const y = boundedString(jwk.y, 256);
    if (!x || !y) return { normalized: null, reason: 'relay-public-key-coordinates-invalid' };

    return {
      normalized: {
        kind: 'relay',
        relay: {
          relayUrl,
          serverId,
          hostEncPubJwk: { kty: 'EC', crv: 'P-256', x, y },
        },
      },
      reason: null,
    };
  }

  return { normalized: null, reason: 'candidate-kind-unsupported' };
};

export const validateInstanceInput = (input) => {
  if (!isRecord(input)) return { normalized: null, reason: 'payload-not-object' };
  if (!Array.isArray(input.candidates)) return { normalized: null, reason: 'candidates-not-array' };
  if (input.candidates.length < 1 || input.candidates.length > MAX_CANDIDATES) {
    return { normalized: null, reason: 'candidate-count-out-of-range' };
  }

  const label = normalizeLabel(input.label);
  if (!label) return { normalized: null, reason: 'label-invalid' };

  const validatedCandidates = input.candidates.map(validateCandidate);
  const invalidIndex = validatedCandidates.findIndex((candidate) => candidate.normalized === null);
  if (invalidIndex !== -1) {
    return {
      normalized: null,
      reason: `candidate-${invalidIndex + 1}-${validatedCandidates[invalidIndex].reason}`,
    };
  }

  const candidates = validatedCandidates.map((candidate) => candidate.normalized);
  const providedServerId = input.serverId === undefined || input.serverId === null
    ? null
    : boundedString(input.serverId, 128);
  if (input.serverId !== undefined && input.serverId !== null && !providedServerId) {
    return { normalized: null, reason: 'server-identity-invalid' };
  }

  const relayServerId = candidates.find((candidate) => candidate.kind === 'relay')?.relay.serverId ?? null;
  if (providedServerId && relayServerId && providedServerId !== relayServerId) {
    return { normalized: null, reason: 'server-identities-conflict' };
  }

  return {
    normalized: {
      serverId: providedServerId || relayServerId,
      label,
      candidates,
    },
    reason: null,
  };
};

export const normalizeInstanceInput = (input) => validateInstanceInput(input).normalized;
