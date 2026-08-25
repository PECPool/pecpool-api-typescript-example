# Contributing

Thank you for improving the PECPool API TypeScript example.

## Scope

Contributions should remain focused on the documented read-only API at `https://api.pecpool.com`.

Accepted changes can include:

- Correctness or security fixes
- Improvements to HMAC signing and exact URL handling
- Support for a newly published public API endpoint
- Clearer examples, public types, and integration documentation
- Additional deterministic offline tests
- Compatibility improvements for supported Node.js and TypeScript versions

Do not add guessed or private endpoints, write operations, database models, infrastructure assumptions, real payloads, credentials, analytics, tracking, or unrelated third-party services.

## Development

1. Fork the repository and create a focused branch.
2. Keep every committed repository file at the root. `node_modules` and `dist` are local generated folders and must remain ignored.
3. Install the exact development tools:

   ```bash
   npm ci
   ```

4. Make the smallest complete change.
5. Update code, types, `README.md`, `API.md`, `llms.txt`, and tests together when the public contract changes.
6. Run:

   ```bash
   npm run check
   ```

7. Confirm that the suite used mocked fetch and made no network request.
8. Open a pull request with a concise explanation and synthetic reproduction.

## Coding Rules

- Use strict TypeScript and ESM-compatible `.js` import suffixes.
- Keep the runtime dependency-free.
- Preserve exact tuple order and RFC 3986 encoding.
- Reuse the same encoded query string in the URL and canonical request.
- Encode each dynamic path segment exactly once.
- Keep authentication data out of logs, errors, tests, fixtures, and documentation.
- Keep built-in TLS verification on and redirects set to `error`.
- Do not add automatic retries or parallel API calls without an explicit, bounded design that respects `Retry-After` and re-signs every attempt.
- Return successful response envelopes unchanged.
- Keep OpenAPI fields optional unless the current public specification marks them required.
- Use synthetic values and mocked transport in tests.

## Pull-Request Checklist

- [ ] The change covers only documented public API behavior.
- [ ] No secret, personal data, account data, miner data, wallet data, or transaction data is included.
- [ ] Query construction and signing use identical bytes.
- [ ] Path segments are encoded exactly once.
- [ ] Tests are deterministic, mocked, and offline.
- [ ] Types and documentation are updated.
- [ ] All committed files remain at the repository root.
- [ ] `package-lock.json` matches `package.json`.
- [ ] `npm run check` passes on Node.js 22 or newer.

Security-sensitive findings must follow `SECURITY.md`, not the public issue tracker.
