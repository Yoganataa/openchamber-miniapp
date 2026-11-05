const MAX_LABEL_LENGTH = 80;
const MAX_CANDIDATES = 12;
const MAX_DIRECT_URL_LENGTH = 2048;
// Pairing-v2 itself caps the complete encoded payload at 16 KiB. A relay URL
// can legitimately be longer than a normal direct API URL (for example a
// self-hosted relay with a long routing path or signed query).
const MAX_RELAY_URL_LENGTH = 16_384;

const SENSITIVE_QUERY_PARAMETERS = new Set([
  'accesskeyid',
  'accesssecret',
  'accesstoken',
  'apikey',
  'authorization',
  'auth',
  'authtoken',
  'bearertoken',
  'cfaccesstoken',
  'cfaccessclientsecret',
  'clientsecret',
  'clienttoken',
  'credential',
  'credentials',
  'grant',
  'googleaccessid',
  'idtoken',
  'jwt',
  'oauth',
  'oauthtoken',
  'password',
  'passwd',
  'pwd',
  'refreshtoken',
  'secret',
  'secretaccesskey',
  'session',
  'sessionid',
  'sessiontoken',
  'sig',
  'signature',
  'token',
  'xamzcredential',
  'xamzsecuritytoken',
  'xamzsignature',
  'xgoogsignature',
]);

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const boundedString = (value, maxLength) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;

const SENSITIVE_QUERY_PARAMETER_PATTERN =
  /(?:token|api.?key|secret|password|passwd|pwd|credential|authorization|^auth$|^grant$|^sig(?:nature)?$|^jwt$)/;

const isSensitiveQueryParameter = (key) => {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return SENSITIVE_QUERY_PARAMETERS.has(normalized) || SENSITIVE_QUERY_PARAMETER_PATTERN.test(normalized);
};

const normalizeLabel = (value) => {
  if (typeof value !== 'string') return null;
  const label = value.trim();
  return label ? label.slice(0, MAX_LABEL_LENGTH) : null;
};

const parseUrl = (value, protocols, { allowQuery = false } = {}) => {
  if (!boundedString(value, MAX_DIRECT_URL_LENGTH)) return null;

  try {
    const parsed = new URL(value);
    if (!protocols.includes(parsed.protocol)) return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;

    if (parsed.search) {
      if (!allowQuery) return null;
      for (const key of parsed.searchParams.keys()) {
        if (isSensitiveQueryParameter(key)) return null;
      }
    }
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/g, '');
  } catch {
    return null;
  }
};

// This mirrors OpenChamber's pairing-v2 normalizeWsUrl contract: accept ws/wss,
// preserve the relay path and ordinary query parameters, and strip only the
// fragment. Account metadata is server-side, however, so credential-bearing
// query strings must not be copied into Telegram's database. Drop the WHOLE
// query from this metadata copy if any credential-like key is present. The
// original candidate remains in the device's upstream local storage and is
// still used by that device's live relay connection.
const parseRelayUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return { url: null, reason: 'relay-url-missing' };
  }
  const raw = value.trim();
  if (raw.length > MAX_RELAY_URL_LENGTH) {
    return { url: null, reason: 'relay-url-too-long' };
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { url: null, reason: 'relay-url-invalid-format' };
  }

  if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
    return { url: null, reason: 'relay-url-protocol-unsupported' };
  }
  if (!parsed.hostname) {
    return { url: null, reason: 'relay-url-host-missing' };
  }
  // Browser pairing still uses the original device-local candidate. Never
  // copy URL-embedded credentials into Telegram's server-side account row:
  // strip them from this metadata copy instead of rejecting a redeemed pairing.
  // The upstream local candidate remains untouched on the device.
  parsed.username = '';
  parsed.password = '';

  const containsCredentialQuery = [...parsed.searchParams.keys()].some(isSensitiveQueryParameter);
  if (containsCredentialQuery) parsed.search = '';
  parsed.hash = '';

  const normalized = parsed.toString();
  if (normalized.length > MAX_RELAY_URL_LENGTH) {
    return { url: null, reason: 'relay-url-too-long' };
  }
  return { url: normalized, reason: null };
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
    const relayUrl = parseRelayUrl(candidate.relay.relayUrl);
    if (!relayUrl.url) return { normalized: null, reason: relayUrl.reason };

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
          relayUrl: relayUrl.url,
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
