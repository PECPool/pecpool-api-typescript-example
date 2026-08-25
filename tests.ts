import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  PECPoolApiClient,
  type FetchImplementation,
} from './PECPoolApiClient.js';
import { PECPoolApiError } from './PECPoolApiError.js';
import {
  buildQueryString,
  createAuthenticationHeaders,
  createCanonicalString,
  createSignature,
  EMPTY_BODY_SHA256,
  generateNonce,
  sha256Hex,
} from './PECPoolSigner.js';

interface SigningVector {
  method: string;
  path: string;
  queryString: string;
  timestamp: string;
  nonce: string;
  body: string;
  bodySha256: string;
  fixtureApiKey: string;
  fixtureApiSecret: string;
  canonicalString: string;
  signature: string;
}

const vector = JSON.parse(
  readFileSync(
    new URL('../signing-test-vector.json', import.meta.url),
    'utf8',
  ),
) as SigningVector;

test('empty-body SHA-256 is exact', () => {
  assert.equal(sha256Hex(''), vector.bodySha256);
  assert.equal(EMPTY_BODY_SHA256, vector.bodySha256);
});

test('query encoding is RFC 3986 and preserves tuple order', () => {
  const actual = buildQueryString([
    ['space', 'a b'],
    ['reserved', "!'()*~"],
    ['slash', 'a/b'],
    ['plus', 'a+b'],
    ['enabled', true],
    ['disabled', false],
    ['zero', 0],
    ['skip', undefined],
  ]);

  assert.equal(
    actual,
    'space=a%20b&reserved=%21%27%28%29%2A~&slash=a%2Fb&plus=a%2Bb&enabled=true&disabled=false&zero=0',
  );
});

test('unsupported query values are rejected', () => {
  assert.throws(
    () => buildQueryString([['float', 1.25]]),
    /safe integer/,
  );
  assert.throws(
    () => buildQueryString([['null', null as never]]),
    /must be a string/,
  );
});

test('canonical snapshot request matches the shared vector', () => {
  const actual = createCanonicalString({
    method: vector.method,
    path: vector.path,
    queryString: vector.queryString,
    timestamp: vector.timestamp,
    nonce: vector.nonce,
    body: vector.body,
  });

  assert.equal(actual, vector.canonicalString);
});

test('empty query keeps an empty canonical line', () => {
  const actual = createCanonicalString({
    method: 'get',
    path: '/v1/ping',
    queryString: '',
    timestamp: '1780000000',
    nonce: '12345678',
  });

  assert.equal(
    actual,
    `GET\n/v1/ping\n\n1780000000\n12345678\n${EMPTY_BODY_SHA256}`,
  );
});

test('deterministic HMAC signature matches the shared vector', () => {
  const actual = createSignature(
    vector.fixtureApiSecret,
    vector.canonicalString,
  );

  assert.equal(actual, vector.signature);
  assert.match(actual, /^[0-9a-f]{64}$/);
});

test('authentication headers match fixed inputs', () => {
  const headers = createAuthenticationHeaders({
    apiKey: vector.fixtureApiKey,
    apiSecret: vector.fixtureApiSecret,
    method: vector.method,
    path: vector.path,
    queryString: vector.queryString,
    body: vector.body,
    timestamp: vector.timestamp,
    nonce: vector.nonce,
  });

  assert.equal(headers['X-PECPool-Key'], vector.fixtureApiKey);
  assert.equal(headers['X-PECPool-Timestamp'], vector.timestamp);
  assert.equal(headers['X-PECPool-Nonce'], vector.nonce);
  assert.equal(headers['X-PECPool-Signature'], vector.signature);
});

test('generated nonces have the required format and are unique', () => {
  const first = generateNonce();
  const second = generateNonce();

  assert.match(first, /^[0-9a-f]{32}$/);
  assert.match(second, /^[0-9a-f]{32}$/);
  assert.notEqual(first, second);
});

test('client signs and sends the exact same snapshot query', async () => {
  let capturedInput: string | URL | Request | undefined;
  let capturedInit: RequestInit | undefined;
  const fetchImplementation: FetchImplementation = async (input, init) => {
    capturedInput = input;
    capturedInit = init;
    return jsonResponse({ success: true, data: { accounts: [] } });
  };
  const client = new PECPoolApiClient(
    vector.fixtureApiKey,
    vector.fixtureApiSecret,
    { fetchImplementation },
  );

  await client.snapshot();

  assert.ok(capturedInput !== undefined);
  assert.ok(capturedInit !== undefined);
  const url = new URL(capturedInput.toString());
  const headers = new Headers(capturedInit.headers);
  const timestamp = requiredHeader(headers, 'X-PECPool-Timestamp');
  const nonce = requiredHeader(headers, 'X-PECPool-Nonce');
  const canonical = createCanonicalString({
    method: 'GET',
    path: url.pathname,
    queryString: url.search.slice(1),
    timestamp,
    nonce,
  });

  assert.equal(
    url.toString(),
    'https://api.pecpool.com/v1/snapshot?hours=24&includeCharts=true&earningsPageSize=100&payoutsPageSize=100',
  );
  assert.equal(capturedInit.method, 'GET');
  assert.equal(capturedInit.redirect, 'error');
  assert.equal(headers.get('X-PECPool-Key'), vector.fixtureApiKey);
  assert.equal(
    headers.get('X-PECPool-Signature'),
    createSignature(vector.fixtureApiSecret, canonical),
  );
});

test('client encodes each path segment exactly once', async () => {
  let capturedUrl = '';
  const fetchImplementation: FetchImplementation = async (input) => {
    capturedUrl = input.toString();
    return jsonResponse({ success: true, data: {} });
  };
  const client = new PECPoolApiClient(
    vector.fixtureApiKey,
    vector.fixtureApiSecret,
    { fetchImplementation },
  );

  await client.accountSummary("farm/a b!'()*~");

  assert.equal(
    capturedUrl,
    'https://api.pecpool.com/v1/accounts/farm%2Fa%20b%21%27%28%29%2A~/summary',
  );
});

test('client exposes safe 429 fields and Retry-After', async () => {
  const fetchImplementation: FetchImplementation = async () =>
    jsonResponse(
      {
        success: false,
        errorCode: 'RATE_LIMITED',
        message: 'Too many requests.',
        retryAfterSeconds: 10,
        serverTimeUtc: '2026-08-25T00:00:00Z',
      },
      429,
      { 'Retry-After': '10' },
    );
  const client = new PECPoolApiClient(
    vector.fixtureApiKey,
    vector.fixtureApiSecret,
    { fetchImplementation },
  );

  await assert.rejects(client.ping(), (error: unknown) => {
    assert.ok(error instanceof PECPoolApiError);
    assert.equal(error.statusCode, 429);
    assert.equal(error.apiErrorCode, 'RATE_LIMITED');
    assert.equal(error.retryAfterSeconds, 10);
    assert.equal(error.serverTimeUtc, '2026-08-25T00:00:00Z');
    assert.doesNotMatch(error.message, new RegExp(vector.fixtureApiSecret));
    return true;
  });
});

test('client rejects invalid successful JSON without retaining the body', async () => {
  const fetchImplementation: FetchImplementation = async () =>
    new Response('not-json', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  const client = new PECPoolApiClient(
    vector.fixtureApiKey,
    vector.fixtureApiSecret,
    { fetchImplementation },
  );

  await assert.rejects(client.ping(), (error: unknown) => {
    assert.ok(error instanceof PECPoolApiError);
    assert.equal(error.statusCode, 200);
    assert.match(error.message, /unexpected JSON value/);
    assert.doesNotMatch(error.message, /not-json/);
    return true;
  });
});

test('client converts network failures to a generic safe error', async () => {
  const fetchImplementation: FetchImplementation = async () => {
    throw new Error(`network failure containing ${vector.fixtureApiSecret}`);
  };
  const client = new PECPoolApiClient(
    vector.fixtureApiKey,
    vector.fixtureApiSecret,
    { fetchImplementation },
  );

  await assert.rejects(client.ping(), (error: unknown) => {
    assert.ok(error instanceof PECPoolApiError);
    assert.equal(error.statusCode, 0);
    assert.equal(
      error.message,
      'A network error prevented the PECPool API request.',
    );
    assert.doesNotMatch(error.message, new RegExp(vector.fixtureApiSecret));
    return true;
  });
});

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function requiredHeader(headers: Headers, name: string): string {
  const value = headers.get(name);
  assert.ok(value !== null, `${name} header is required.`);
  return value;
}
