# Instructions for Coding Agents

## Purpose

Maintain a secure, typed, runtime-dependency-free TypeScript example for the documented read-only PECPool API v1 on server-side Node.js. This repository is an integration example, not the PECPool backend and not a browser SDK.

## Sources of Truth

Read these before changing behavior:

1. `README.md`
2. `API.md`
3. `SECURITY.md`
4. `https://api.pecpool.com/pecpoolapi/v1/pecpoolapi.json`

Do not infer behavior from private systems, unrelated repositories, cached payloads, or undocumented assumptions.

## Non-Negotiable Rules

- Use only public, documented `GET` endpoints under `https://api.pecpool.com/v1`.
- Do not add write operations, internal endpoints, database structures, infrastructure details, credentials, real payloads, or private business logic.
- Keep the API Secret in trusted server-side Node.js code. Never send, print, serialize, log, or embed it.
- Never make this code browser-compatible by exposing credentials to React, Vue, public Next.js code, a browser extension, or a mobile bundle.
- Never log the canonical request, signature, signed headers, private response body, account, worker, miner, wallet, payout, or transaction data.
- Build the query string once from ordered tuples and reuse the exact same bytes in the URL and canonical request.
- Preserve tuple order and strict RFC 3986 encoding. Serialize booleans as lowercase `true` or `false` and spaces as `%20`.
- Encode each dynamic path segment exactly once.
- Use the literal LF character `\n` in the canonical request; never use `os.EOL`.
- Use Unix UTC seconds and a fresh `randomBytes(16).toString('hex')` nonce for every request.
- Keep built-in TLS certificate and hostname verification enabled. Never use `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- Keep redirect handling set to `error`.
- Do not automatically retry. Any future retry must be opt-in, bounded, honor `Retry-After`, and regenerate the timestamp, nonce, canonical request, and signature.
- Keep tests mocked, synthetic, and offline by default.
- Keep every committed file at the repository root. Do not introduce directories without an explicit project decision. Generated `dist` and `node_modules` remain ignored.

## Change Requirements

- Use strict TypeScript and ESM-compatible `.js` import suffixes.
- Preserve the dependency-free runtime.
- Return successful API envelopes unchanged.
- Keep public OpenAPI properties optional unless the source marks them required.
- Treat BTC and USD decimal strings as strings.
- Document JavaScript `int64` precision limits when relevant.
- Handle unknown non-2xx statuses and error codes safely.
- Update code, types, tests, `README.md`, `API.md`, `llms.txt`, and `project-metadata.json` together when the public contract changes.
- Change `lastVerified` only after checking the current official OpenAPI document.
- Run `npm ci` and `npm run check`.
- Review every dependency and `package-lock.json` change.
- Never use real credentials or live private data in a test, fixture, issue, or pull request.

## Review Priorities

1. Credential confidentiality and server-only use
2. Exact URL and signature bytes
3. TLS, redirect, and replay prevention
4. Rate-limit compliance
5. Type and response compatibility
6. Clear public documentation
