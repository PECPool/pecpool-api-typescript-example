# PECPool API v1 Integration Reference

This file summarizes the public connection contract used by this repository. The current source of truth is the [PECPool OpenAPI document](https://api.pecpool.com/pecpoolapi/v1/pecpoolapi.json).

- Base URL: `https://api.pecpool.com`
- API version: `v1`
- Access mode: read-only
- Current operations: `GET`
- Authentication: HMAC-SHA256
- Last verified: 2026-08-25

No private endpoint, backend design, database structure, infrastructure detail, or credential is documented here.

## Required Headers

Every `/v1` request requires:

| Header | Value |
| --- | --- |
| `X-PECPool-Key` | Authorized Farm API Key |
| `X-PECPool-Timestamp` | Current Unix UTC time in seconds |
| `X-PECPool-Nonce` | Unique random string, 8–128 characters |
| `X-PECPool-Signature` | Lowercase hexadecimal HMAC-SHA256 signature |

The API Secret is the local HMAC key. Never send it in a header, URL, body, log, issue, or response.

## Canonical Request

Join these values with the literal LF character `\n` and no extra newline at the end:

```text
METHOD
PATH
QUERY_STRING
TIMESTAMP
NONCE
BODY_SHA256
```

For example, this URL:

```text
https://api.pecpool.com/v1/snapshot?hours=24&includeCharts=true&earningsPageSize=100&payoutsPageSize=100
```

produces this canonical request when the shown synthetic timestamp and nonce are used:

```text
GET
/v1/snapshot
hours=24&includeCharts=true&earningsPageSize=100&payoutsPageSize=100
1780000000
8f3c1f0e9d4a4a0c9b2a1f7d6e5c4b3a
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

The final line is the SHA-256 hash of an empty body. Generate the signature with:

```text
lowercase_hex(HMAC-SHA256(API_SECRET, canonical_request))
```

With the synthetic secret `test-secret`, the example signature is:

```text
7fbe58a4ac76d7f17cd289449665cf0f2ba9b3745a106b5672c3bd96f0db95a2
```

These fixture values are public test data, not working credentials.

## Exact Encoding Rules

- Uppercase the HTTP method.
- Sign only the final encoded path, beginning with `/`; do not include the domain.
- Do not include the leading `?` in `QUERY_STRING`.
- When the URL has no query, keep the query line empty.
- Preserve the same query parameter order and percent-encoding in the signature and URL.
- Encode query names, values, and individual path segments according to RFC 3986.
- Encode spaces as `%20`, not `+`.
- Encode booleans as lowercase `true` and `false`.
- Use Unix seconds, not milliseconds.
- Create a new nonce, timestamp, canonical request, and signature for every request and retry.
- Never use `os.EOL`; it produces the wrong canonical bytes on Windows.

`PECPoolSigner.buildQueryString()` uses ordered tuples and builds the query once. `PECPoolApiClient` reuses that exact string for both the URL and canonical request, then verifies the final `URL` serialization before sending.

## Public Endpoints

| Method | Path | Query parameters and defaults | Successful data type |
| --- | --- | --- | --- |
| `GET` | `/v1/ping` | — | `PingData` |
| `GET` | `/v1/farm` | — | `FarmData` |
| `GET` | `/v1/monitor` | — | `MonitorData` |
| `GET` | `/v1/accounts` | — | `AccountSummary[]` |
| `GET` | `/v1/accounts/{account}/summary` | — | `AccountSummary` |
| `GET` | `/v1/accounts/{account}/monitor` | `workersPage=1`, `workersPageSize=100`, `minersPage=1`, `minersPageSize=100`, `hours=24` | `AccountMonitorData` |
| `GET` | `/v1/accounts/{account}/workers` | `page=1`, `pageSize=100`, `includeCharts=false`, `hours=24` | `Worker[]` |
| `GET` | `/v1/accounts/{account}/miners` | `page=1`, `pageSize=100`, `includeCharts=false`, `hours=24` | `Miner[]` |
| `GET` | `/v1/accounts/{account}/earnings` | `page=1`, `pageSize=100` | `Earning[]` |
| `GET` | `/v1/accounts/{account}/payouts` | `page=1`, `pageSize=100` | `Payout[]` |
| `GET` | `/v1/accounts/{account}/charts/hashrate` | `hours=24` | `ChartPoint[]` |
| `GET` | `/v1/accounts/{account}/workers/{worker}/charts/hashrate` | `hours=24` | `ChartPoint[]` |
| `GET` | `/v1/accounts/{account}/miners/{minerKey}/charts/hashrate` | `hours=24` | `ChartPoint[]` |
| `GET` | `/v1/snapshot` | `hours=24`, `includeCharts=true`, `earningsPageSize=100`, `payoutsPageSize=100` | `SnapshotData` |

All query parameters are optional. All path parameters shown in braces are required. This client sends documented defaults explicitly and signs those exact values. The public specification does not define numeric maximums; handle `PAGE_SIZE_TOO_LARGE` without inventing a limit.

## Response Envelope

Successful responses use `PECPoolApiResponse<T>` with these public fields:

| Field | Meaning |
| --- | --- |
| `success` | Request result flag |
| `data` | Endpoint-specific object, list, or `null` |
| `pagination` | Pagination object or `null` |
| `serverTimeUtc` | Server timestamp in ISO-8601 UTC format |

Pagination can contain `page`, `pageSize`, `totalRows`, `totalPages`, and `hasNextPage`. Consumers should tolerate new response fields and nullable values.

Keep BTC and USD decimal strings as strings. Native JavaScript numbers cannot exactly represent every possible OpenAPI `int64`; use a lossless JSON approach if an application requires exact integers beyond `Number.MAX_SAFE_INTEGER`.

## Rate Limit

Each Farm Key may make one request every 10 seconds across the API. HTTP `429` includes a retry delay through `Retry-After` and/or `retryAfterSeconds`.

The example client does not retry automatically. A retry must wait for the delay and create a completely new signed request.

## Error Envelope

Public error responses can contain:

```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Safe error message",
  "retryAfterSeconds": null,
  "serverTimeUtc": "ISO-8601 UTC timestamp"
}
```

Documented common codes include:

- `INVALID_KEY`
- `INACTIVE_KEY`
- `INVALID_SIGNATURE`
- `INVALID_TIMESTAMP`
- `INVALID_NONCE`
- `RATE_LIMITED`
- `ACCOUNT_NOT_ALLOWED`
- `PAGE_SIZE_TOO_LARGE`

Missing authentication headers can produce `MISSING_AUTH_HEADERS`. Treat any non-2xx HTTP status or explicit `success: false` envelope as a failed request.

## Node.js Transport Rules

- Use the built-in Node.js `fetch` and `crypto` implementations.
- Keep normal TLS certificate and hostname verification enabled.
- Set `redirect: 'error'` so signed headers are never forwarded after a redirect.
- Abort requests that exceed the configured timeout.
- Parse JSON from `application/json`, `text/json`, or JSON carried as `text/plain`.
- Never print the request headers, canonical string, signature, API Secret, or raw private response.
