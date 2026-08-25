export interface PECPoolApiErrorOptions {
  statusCode?: number;
  apiErrorCode?: string;
  retryAfterSeconds?: number;
  serverTimeUtc?: string;
}

/**
 * Safe structured error for API and transport failures.
 *
 * Request headers, signatures, canonical strings, credentials, and response
 * bodies are intentionally not retained.
 */
export class PECPoolApiError extends Error {
  readonly statusCode: number;
  readonly apiErrorCode: string | undefined;
  readonly retryAfterSeconds: number | undefined;
  readonly serverTimeUtc: string | undefined;

  constructor(message: string, options: PECPoolApiErrorOptions = {}) {
    super(message);
    this.name = 'PECPoolApiError';
    this.statusCode = options.statusCode ?? 0;
    this.apiErrorCode = options.apiErrorCode;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.serverTimeUtc = options.serverTimeUtc;
  }
}
