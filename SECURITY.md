# Security Policy

## Safe Use

This repository is a server-side Node.js example. Do not bundle it into browser code, frontend frameworks, public Next.js client components, browser extensions, or mobile applications.

- Store `PECPOOL_API_KEY` and `PECPOOL_API_SECRET` in protected environment variables, a deployment secret manager, or a local git-ignored `.env` file.
- Restrict local credential-file permissions where supported.
- Never commit `.env`, credentials, signed headers, canonical requests, private API payloads, logs, or screenshots containing PECPool data.
- Never put credentials in command-line arguments because shell history and process lists may expose them.
- Never set `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- Never add a custom agent or dispatcher that disables TLS certificate or hostname validation.
- Keep redirect handling set to `error` for signed requests.
- Generate a new timestamp, nonce, canonical request, and signature for every request and retry.
- Keep the system clock synchronized so timestamps remain within the API's accepted window.
- Respect the one-request-per-10-seconds Farm Key rate limit.
- Rotate a credential immediately if it may have been exposed, then remove it from every reachable log and repository history.

The client intentionally does not retain authentication headers, signatures, canonical strings, credentials, or response bodies in errors.

## Dependency Boundary

Production transport and signing use only built-in Node.js APIs. `typescript` and `@types/node` are development-only packages locked by `package-lock.json`.

Review lock-file changes before merging. Run `npm ci` rather than accepting an unreviewed dependency update.

## Reporting a Vulnerability

Do not disclose a potential vulnerability, exploit, credential, account identifier, wallet detail, transaction detail, miner detail, or private response in a public GitHub issue.

Use the [official PECPool contact page](https://pecpool.com/contact/) to request a private security-reporting channel. Include only the minimum information needed to begin triage. PECPool can then provide instructions for sharing sensitive reproduction details safely.

For a non-sensitive defect limited to this example repository, open a GitHub issue with:

- Node.js version and operating system
- A minimal reproduction using synthetic values and mocked fetch
- Expected and actual behavior
- Sanitized error code and HTTP status

Never include a real API key, secret, signature, canonical request, account name, worker name, miner key, wallet, transaction ID, or raw private payload.

## Supported Code

Security fixes apply to the latest repository release and current default branch. The hosted PECPool service has its own operational update process; this repository does not define service support or response timelines.
