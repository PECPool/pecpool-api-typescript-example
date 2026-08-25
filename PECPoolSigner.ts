import {
  createHash,
  createHmac,
  randomBytes,
  type BinaryLike,
} from 'node:crypto';

export const EMPTY_BODY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export type QueryValue = string | number | boolean | undefined;
export type QueryEntry = readonly [name: string, value: QueryValue];

export interface AuthenticationHeaders {
  'X-PECPool-Key': string;
  'X-PECPool-Timestamp': string;
  'X-PECPool-Nonce': string;
  'X-PECPool-Signature': string;
}

export interface AuthenticationHeaderInput {
  apiKey: string;
  apiSecret: string;
  method: string;
  path: string;
  queryString?: string;
  body?: BinaryLike;
  timestamp?: string;
  nonce?: string;
}

/** Encode one query name, query value, or path segment as RFC 3986. */
export function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Build the final query string once while preserving tuple insertion order.
 */
export function buildQueryString(entries: readonly QueryEntry[]): string {
  const pairs: string[] = [];

  for (const [name, value] of entries) {
    if (name.length === 0) {
      throw new TypeError('Query parameter names must not be empty.');
    }

    if (value === undefined) {
      continue;
    }

    let serialized: string;

    if (typeof value === 'boolean') {
      serialized = value ? 'true' : 'false';
    } else if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) {
        throw new TypeError(`Query parameter "${name}" must be a safe integer.`);
      }

      serialized = String(value);
    } else if (typeof value === 'string') {
      serialized = value;
    } else {
      throw new TypeError(
        `Query parameter "${name}" must be a string, safe integer, boolean, or undefined.`,
      );
    }

    pairs.push(`${encodeRfc3986(name)}=${encodeRfc3986(serialized)}`);
  }

  return pairs.join('&');
}

export function sha256Hex(value: BinaryLike): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createCanonicalString(input: {
  method: string;
  path: string;
  queryString: string;
  timestamp: string;
  nonce: string;
  body?: BinaryLike;
}): string {
  const method = input.method.toUpperCase();
  const body = input.body ?? '';

  if (!/^[A-Z]+$/.test(method)) {
    throw new TypeError('HTTP method must contain only ASCII letters.');
  }

  if (
    !input.path.startsWith('/') ||
    input.path.includes('?') ||
    input.path.includes('#')
  ) {
    throw new TypeError(
      'Path must start with "/" and must not contain a query or fragment.',
    );
  }

  rejectLineBreaks('Path', input.path);
  rejectLineBreaks('Query string', input.queryString);

  if (!/^\d+$/.test(input.timestamp)) {
    throw new TypeError('Timestamp must be Unix time in whole seconds.');
  }

  if (input.nonce.length < 8 || input.nonce.length > 128) {
    throw new TypeError('Nonce must contain between 8 and 128 characters.');
  }

  rejectLineBreaks('Nonce', input.nonce);

  return [
    method,
    input.path,
    input.queryString,
    input.timestamp,
    input.nonce,
    sha256Hex(body),
  ].join('\n');
}

export function createSignature(
  apiSecret: string,
  canonicalString: string,
): string {
  if (apiSecret.length === 0) {
    throw new TypeError('API secret must not be empty.');
  }

  return createHmac('sha256', apiSecret)
    .update(canonicalString, 'utf8')
    .digest('hex');
}

export function createAuthenticationHeaders(
  input: AuthenticationHeaderInput,
): AuthenticationHeaders {
  if (input.apiKey.length === 0) {
    throw new TypeError('API key must not be empty.');
  }

  rejectLineBreaks('API key', input.apiKey);

  const timestamp =
    input.timestamp ?? Math.floor(Date.now() / 1_000).toString();
  const nonce = input.nonce ?? generateNonce();
  const queryString = input.queryString ?? '';
  const body = input.body ?? '';
  const canonicalString = createCanonicalString({
    method: input.method,
    path: input.path,
    queryString,
    timestamp,
    nonce,
    body,
  });

  return {
    'X-PECPool-Key': input.apiKey,
    'X-PECPool-Timestamp': timestamp,
    'X-PECPool-Nonce': nonce,
    'X-PECPool-Signature': createSignature(
      input.apiSecret,
      canonicalString,
    ),
  };
}

export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

function rejectLineBreaks(field: string, value: string): void {
  if (value.includes('\r') || value.includes('\n')) {
    throw new TypeError(`${field} must not contain line breaks.`);
  }
}
