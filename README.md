<div align="center">

# PECPool API — TypeScript / Node.js Example

**A secure, typed Node.js client and command-line example for the read-only PECPool API v1.**

[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![API v1](https://img.shields.io/badge/PECPool_API-v1-0A7EA4)](https://api.pecpool.com/)
[![Read only](https://img.shields.io/badge/access-read--only-2EA44F)](https://api.pecpool.com/index.html)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Official Website](https://pecpool.com/) · [Control Panel](https://cp.pecpool.com/) · [API Documentation](https://api.pecpool.com/index.html) · [OpenAPI](https://api.pecpool.com/pecpoolapi/v1/pecpoolapi.json) · [Support](https://pecpool.com/contact/)

</div>

> [!IMPORTANT]
> Use this project only in trusted server-side Node.js processes. Never bundle a Farm API Secret into browser JavaScript, React, Vue, a public Next.js client component, a mobile application, a public repository, a screenshot, or a log.

## What This Repository Is

This repository is the official TypeScript and Node.js connection example for the public PECPool API at `https://api.pecpool.com`. It documents and implements only the technical details required to authenticate and call the published read-only endpoints.

It includes:

- A strict ESM TypeScript client for Node.js 22 and newer
- Typed public API response models
- Exact HMAC-SHA256 request signing with Node's built-in `crypto`
- RFC 3986 query encoding with explicit tuple order
- A typed method for every published API v1 endpoint
- Built-in `fetch`, TLS verification, redirect blocking, and request timeouts
- Safe error and `Retry-After` handling without automatic retries
- A command-line program that makes one request per invocation
- Deterministic `node:test` tests using synthetic credentials and mocked transport
- Human-readable and AI-readable repository metadata

The runtime has no third-party package. TypeScript and Node type definitions are development-only dependencies.

This repository is not the PECPool backend, control panel, database, infrastructure configuration, or production source code. It contains no internal schema, private endpoint, real account data, credential, or operational secret.

## Official Resources

| Resource | Official URL |
| --- | --- |
| PECPool website | [https://pecpool.com](https://pecpool.com/) |
| PECPool control panel | [https://cp.pecpool.com](https://cp.pecpool.com/) |
| API base URL | [https://api.pecpool.com](https://api.pecpool.com/) |
| Interactive API documentation | [https://api.pecpool.com/index.html](https://api.pecpool.com/index.html) |
| Canonical OpenAPI document | [OpenAPI JSON](https://api.pecpool.com/pecpoolapi/v1/pecpoolapi.json) |
| Help and FAQs | [https://pecpool.com/faqs](https://pecpool.com/faqs/) |
| Contact and support | [https://pecpool.com/contact](https://pecpool.com/contact/) |

Always verify the complete hostname before using an API key or secret. This example sends signed requests only to `https://api.pecpool.com`.

## Requirements

- Node.js 22 or newer; Node.js 24 LTS is recommended
- npm
- An authorized PECPool Farm API Key and Secret

Check the local runtime:

```bash
node --version
npm --version
```

## 60-Second Quick Start

1. Install the development tools from the committed lock file:

   ```bash
   npm ci
   ```

2. Copy the example configuration:

   ```bash
   cp .env.example .env
   ```

3. Put your authorized Farm credentials in `.env`:

   ```dotenv
   PECPOOL_API_KEY=your_farm_api_key
   PECPOOL_API_SECRET=your_farm_api_secret
   PECPOOL_API_TIMEOUT=30
   ```

4. Protect the local file where supported:

   ```bash
   chmod 600 .env
   ```

5. Make one compiled, signed test request:

   ```bash
   npm run cli -- ping
   ```

The CLI loads `.env` through Node.js itself. Existing operating-system environment variables remain suitable for deployment and secret-manager workflows.

> [!NOTE]
> Every CLI command performs exactly one API request. Wait at least 10 seconds before running another command with the same Farm Key.

## CLI Examples

Show every command without requiring credentials:

```bash
npm run cli -- help
```

Retrieve high-level data:

```bash
npm run cli -- ping
npm run cli -- farm
npm run cli -- monitor
npm run cli -- accounts
npm run cli -- snapshot
```

Retrieve account-specific data:

```bash
npm run cli -- account-summary YOUR_ACCOUNT
npm run cli -- workers YOUR_ACCOUNT
npm run cli -- miners YOUR_ACCOUNT
npm run cli -- earnings YOUR_ACCOUNT 1 100
npm run cli -- payouts YOUR_ACCOUNT 1 100
```

Request charts or custom snapshot options:

```bash
npm run cli -- account-chart YOUR_ACCOUNT 24
npm run cli -- worker-chart YOUR_ACCOUNT YOUR_WORKER 24
npm run cli -- miner-chart YOUR_ACCOUNT YOUR_MINER_KEY 24
npm run cli -- snapshot 24 true 100 100
```

Boolean command arguments must be the literal word `true` or `false`. Page numbers, page sizes, and hours must be positive safe integers. The public API may enforce additional configured limits.

## Endpoint and Command Reference

All published operations are `GET` and require HMAC authentication.

| CLI command | API path | Optional arguments and defaults |
| --- | --- | --- |
| `ping` | `/v1/ping` | — |
| `farm` | `/v1/farm` | — |
| `monitor` | `/v1/monitor` | — |
| `accounts` | `/v1/accounts` | — |
| `account-summary ACCOUNT` | `/v1/accounts/{account}/summary` | — |
| `account-monitor ACCOUNT` | `/v1/accounts/{account}/monitor` | `workersPage=1`, `workersPageSize=100`, `minersPage=1`, `minersPageSize=100`, `hours=24` |
| `workers ACCOUNT` | `/v1/accounts/{account}/workers` | `page=1`, `pageSize=100`, `includeCharts=false`, `hours=24` |
| `miners ACCOUNT` | `/v1/accounts/{account}/miners` | `page=1`, `pageSize=100`, `includeCharts=false`, `hours=24` |
| `earnings ACCOUNT` | `/v1/accounts/{account}/earnings` | `page=1`, `pageSize=100` |
| `payouts ACCOUNT` | `/v1/accounts/{account}/payouts` | `page=1`, `pageSize=100` |
| `account-chart ACCOUNT` | `/v1/accounts/{account}/charts/hashrate` | `hours=24` |
| `worker-chart ACCOUNT WORKER` | `/v1/accounts/{account}/workers/{worker}/charts/hashrate` | `hours=24` |
| `miner-chart ACCOUNT MINER_KEY` | `/v1/accounts/{account}/miners/{minerKey}/charts/hashrate` | `hours=24` |
| `snapshot` | `/v1/snapshot` | `hours=24`, `includeCharts=true`, `earningsPageSize=100`, `payoutsPageSize=100` |

For parameter types and current response models, use the [canonical OpenAPI document](https://api.pecpool.com/pecpoolapi/v1/pecpoolapi.json). `API.md` provides a compact integration reference.

## Authentication

Every `/v1` request sends these headers:

```http
X-PECPool-Key: your_farm_key
X-PECPool-Timestamp: unix_timestamp_seconds
X-PECPool-Nonce: unique_random_string
X-PECPool-Signature: lowercase_hex_hmac_sha256
```

The API Secret is never sent. It is used locally as the HMAC key.

Create the canonical string with exactly six LF-separated values:

```text
METHOD
PATH
QUERY_STRING
TIMESTAMP
NONCE
BODY_SHA256
```

Signing rules:

- `METHOD` is uppercase, currently `GET`.
- `PATH` contains only the encoded URL path, never the scheme or hostname.
- `QUERY_STRING` is exactly the encoded query sent in the URL, without `?`.
- An empty query still occupies an empty line in the canonical string.
- `TIMESTAMP` is current Unix time in UTC seconds, not milliseconds.
- `NONCE` is unique for every request and contains 8–128 characters.
- `BODY_SHA256` is the SHA-256 hash of the exact request body.
- Canonical lines always use `\n`; never use the operating system's newline.

All current operations are `GET` requests with an empty body. Their body hash is:

```text
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

Generate the header value as:

```text
lowercase_hex(HMAC-SHA256(API_SECRET, canonical_string))
```

`PECPoolSigner.ts` implements this contract. It accepts ordered query tuples, uses a strict RFC 3986 encoder, writes booleans as `true` or `false`, and reuses the identical encoded bytes in the request URL and signature.

> [!WARNING]
> Do not use a separately reconstructed or sorted query for signing. A change in order, percent-encoding, case, path, or newline placement produces `INVALID_SIGNATURE`.

## Build and Use the Typed Client

Build JavaScript and declaration files into the local git-ignored `dist` directory:

```bash
npm run build
```

Use the compiled ESM client in server-side code:

```typescript
import {
  PECPoolApiClient,
  PECPoolApiError,
} from './dist/index.js';

const apiKey = process.env.PECPOOL_API_KEY;
const apiSecret = process.env.PECPOOL_API_SECRET;

if (apiKey === undefined || apiSecret === undefined) {
  throw new Error('PECPool API credentials are not configured.');
}

const client = new PECPoolApiClient(apiKey, apiSecret);

try {
  const response = await client.snapshot();
  const accounts = response.data?.accounts ?? [];
} catch (error: unknown) {
  if (error instanceof PECPoolApiError) {
    // Record only safe fields. Never log signed headers or private payloads.
    console.error({
      statusCode: error.statusCode,
      apiErrorCode: error.apiErrorCode,
      retryAfterSeconds: error.retryAfterSeconds,
    });
  }
}
```

The client returns successful envelopes unchanged. Types provide editor support while allowing the runtime to remain forward-compatible with new public fields.

## Responses and Type Safety

The standard success envelope contains:

```json
{
  "success": true,
  "data": {},
  "pagination": null,
  "serverTimeUtc": "ISO-8601 UTC timestamp"
}
```

Depending on the endpoint, `data` is an object, a list, or `null`. Paginated responses can include `page`, `pageSize`, `totalRows`, `totalPages`, and `hasNextPage`.

Important TypeScript and JavaScript rules:

- Public OpenAPI properties are optional in `PECPoolTypes.ts` because the schemas do not define required-property arrays.
- Keep BTC and USD amount fields as decimal strings; do not convert them to binary floating-point numbers.
- Treat `serverTimeUtc` and other `*Utc` values as ISO-8601 UTC timestamps.
- OpenAPI `int64` values are represented by normal JSON numbers. If an application can receive values above `Number.MAX_SAFE_INTEGER`, use a lossless JSON strategy before relying on exact integer precision.
- Do not publish real farm, account, worker, miner, payout, wallet, or transaction data in tests or issues.

## Rate Limit and Retries

Each Farm Key is limited to one request every 10 seconds. A request sent too soon returns HTTP `429` and may provide both `Retry-After` and `retryAfterSeconds`.

This client does not retry automatically. If your application retries:

1. Wait for the server-provided delay.
2. Generate a new timestamp.
3. Generate a new nonce.
4. Rebuild and sign the request again.

Never replay the same signed request because nonce reuse is rejected.

## Common API Errors

| Error code | What to check |
| --- | --- |
| `MISSING_AUTH_HEADERS` | All four authentication headers must be present. |
| `INVALID_KEY` | Confirm the configured Farm API Key. |
| `INACTIVE_KEY` | Confirm that the Farm Key is active. |
| `INVALID_SIGNATURE` | Check method, path, exact query bytes and order, timestamp, nonce, body hash, and secret. |
| `INVALID_TIMESTAMP` | Use current Unix UTC seconds and keep the host clock synchronized. |
| `INVALID_NONCE` | Generate a fresh 8–128 character nonce for every request. |
| `RATE_LIMITED` | Wait for `Retry-After`, then create a newly signed request. |
| `ACCOUNT_NOT_ALLOWED` | Request only an account authorized for the Farm Key. |
| `PAGE_SIZE_TOO_LARGE` | Use a smaller page size accepted by the current service configuration. |

The client converts every non-2xx result and every explicit `success: false` envelope into `PECPoolApiError`. It exposes only safe diagnostic fields: HTTP status, API error code, retry delay, server time, and message.

## Security Design

- The API base URL is fixed to `https://api.pecpool.com`.
- Credentials come from environment variables or a git-ignored local `.env` file.
- Private class fields reduce accidental credential access.
- The API Secret, canonical string, signature, headers, and response body are never retained by errors.
- Built-in Node.js TLS peer and hostname verification remains enabled.
- Redirects are rejected so signed headers are not forwarded to another destination.
- The final `URL` path and query are checked against the exact signed values before sending.
- Request timeouts use `AbortController`.
- Automatic retries and parallel multi-endpoint commands are intentionally disabled.
- User-controlled path segments are encoded exactly once.

Never set `NODE_TLS_REJECT_UNAUTHORIZED=0` and never add an agent or dispatcher that disables certificate validation.

Read `SECURITY.md` before deploying or reporting a vulnerability.

## Tests

Run strict type checking and the complete offline suite:

```bash
npm run check
```

Individual commands:

```bash
npm run typecheck
npm test
```

The 13 tests use only `node:test`, mocked `fetch`, and the synthetic values in `signing-test-vector.json`. They do not read `.env`, use real credentials, contact PECPool, or consume the API rate limit.

## Repository Files

| File | Purpose |
| --- | --- |
| `PECPoolApiClient.ts` | Typed endpoint methods and secure built-in fetch transport |
| `PECPoolSigner.ts` | RFC 3986 encoding, canonical string, nonce, and HMAC signature |
| `PECPoolApiError.ts` | Safe structured API and transport errors |
| `PECPoolTypes.ts` | Public API response types |
| `index.ts` | Public TypeScript exports |
| `example.ts` | One-request-per-run CLI application |
| `tests.ts` | Dependency-free-runtime offline test suite |
| `signing-test-vector.json` | Synthetic deterministic signing fixture |
| `package.json` / `package-lock.json` | Reproducible development tools and scripts |
| `tsconfig.json` | Strict ESM compiler configuration |
| `API.md` | Compact public API integration reference |
| `SECURITY.md` | Credential and vulnerability guidance |
| `CONTRIBUTING.md` | Contribution rules and pull-request checklist |
| `GITHUB.md` | Ready-to-copy GitHub repository settings |
| `llms.txt` | Concise AI-readable repository context |
| `AGENTS.md` | Safety and maintenance rules for coding agents |
| `project-metadata.json` | Machine-readable repository identity |

All files in the downloadable ZIP are at its root. `node_modules` and `dist` are generated locally and are intentionally excluded from Git.

## AI and Automation Guidance

Automated tools should read `AGENTS.md`, `llms.txt`, this README, and the current OpenAPI document before changing integration code. They must not infer private endpoints, write operations, database structures, credentials, or undocumented limits.

The canonical one-sentence project description is:

> PECPool API TypeScript Example is the official Node.js 22+ reference for securely calling the read-only PECPool API v1 with typed HMAC-SHA256 authentication.

## Contributing and Support

For code changes, read `CONTRIBUTING.md` and open an issue or pull request in this repository. Do not include account-specific or sensitive data.

For PECPool account, API access, farm, miner, payout, or operational questions, use the [official contact page](https://pecpool.com/contact/) or the authenticated [PECPool control panel](https://cp.pecpool.com/).

## License

The example code is available under the [MIT License](LICENSE). The license applies only to this repository's example software; it does not license the hosted PECPool service, API data, branding, or trademarks.

---

<div align="center">

**Official API: [https://api.pecpool.com](https://api.pecpool.com/)**

</div>
