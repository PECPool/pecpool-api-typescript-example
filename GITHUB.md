# GitHub Repository Setup

Use these values when creating the TypeScript and Node.js example repository.

## Repository Identity

| Setting | Value |
| --- | --- |
| Owner | `PECPool` |
| Repository name | `pecpool-api-typescript-example` |
| Expected URL | `https://github.com/PECPool/pecpool-api-typescript-example` |
| Visibility | Public |
| Default branch | `main` |
| Homepage | `https://api.pecpool.com/` |
| License | MIT |

## Description

Copy this exact GitHub description:

```text
Official PECPool TypeScript/Node.js API example with HMAC-SHA256 signing, typed endpoints, secure configuration, and tests.
```

The description is under GitHub's 160-character limit.

## Topics

Add these repository topics:

```text
pecpool
typescript
nodejs
bitcoin
bitcoin-mining
mining-pool
api-client
rest-api
hmac-sha256
openapi
security
example-project
```

## Upload Through the GitHub Website

This ZIP contains no parent project folder and no nested repository folders. After extraction, every included file is ready for the repository root.

1. Create `PECPool/pecpool-api-typescript-example` as an empty public repository.
2. Do not initialize it with a README, `.gitignore`, or license; those files are already included.
3. Extract the ZIP on your computer.
4. In the empty repository, select **Add file → Upload files**.
5. Select every extracted file, including hidden files such as `.gitignore`, `.gitattributes`, `.editorconfig`, `.markdownlint.json`, and `.env.example`.
6. Use this commit message:

   ```text
   Initial TypeScript API example
   ```

7. Commit directly to `main`.
8. Add the description, homepage, and topics shown above.
9. Confirm that GitHub displays `README.md`, detects TypeScript, and recognizes the MIT license.

If the operating-system file picker hides filenames beginning with `.`, enable **Show hidden files** before selecting them.

## Recommended Repository Settings

- Enable Issues for reproducible code defects.
- Enable Discussions only if PECPool plans to support community integration questions there.
- Enable vulnerability reporting or private security advisories when available.
- Keep GitHub Pages disabled; the official API documentation is already hosted at `https://api.pecpool.com/`.
- Protect `main` if multiple maintainers will publish changes.
- Require review before merging authentication, transport, dependency, or lock-file changes.

GitHub Actions is intentionally not included because workflow files require nested `.github/workflows` folders, while this upload package is required to remain flat.

## Suggested Repository Family

```text
pecpool-api-php-example
pecpool-api-typescript-example
pecpool-api-python-example
pecpool-api-csharp-example
pecpool-api-java-example
pecpool-api-go-example
```
