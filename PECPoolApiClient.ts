import { PECPoolApiError } from './PECPoolApiError.js';
import {
  buildQueryString,
  createAuthenticationHeaders,
  encodeRfc3986,
  type QueryEntry,
} from './PECPoolSigner.js';
import type {
  AccountMonitorData,
  AccountSummary,
  ChartPoint,
  Earning,
  FarmData,
  Miner,
  MonitorData,
  Payout,
  PECPoolApiResponse,
  PingData,
  SnapshotData,
  Worker,
} from './PECPoolTypes.js';

export const PECPOOL_API_BASE_URL = 'https://api.pecpool.com';

export type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface PECPoolApiClientOptions {
  timeoutMs?: number;
  /** Test seam. Production code should use the built-in Node.js fetch. */
  fetchImplementation?: FetchImplementation;
}

/** Dependency-free, read-only client for the public PECPool API v1. */
export class PECPoolApiClient {
  readonly #apiKey: string;
  readonly #apiSecret: string;
  readonly #timeoutMs: number;
  readonly #fetch: FetchImplementation;

  constructor(
    apiKey: string,
    apiSecret: string,
    options: PECPoolApiClientOptions = {},
  ) {
    const normalizedKey = apiKey.trim();
    const timeoutMs = options.timeoutMs ?? 30_000;

    if (normalizedKey.length === 0) {
      throw new TypeError('PECPOOL_API_KEY must not be empty.');
    }

    if (apiSecret.length === 0) {
      throw new TypeError('PECPOOL_API_SECRET must not be empty.');
    }

    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 300_000) {
      throw new TypeError('Timeout must be an integer from 1,000 to 300,000 milliseconds.');
    }

    this.#apiKey = normalizedKey;
    this.#apiSecret = apiSecret;
    this.#timeoutMs = timeoutMs;
    this.#fetch = options.fetchImplementation ?? globalThis.fetch.bind(globalThis);
  }

  ping(): Promise<PECPoolApiResponse<PingData>> {
    return this.#get<PingData>('/v1/ping');
  }

  farm(): Promise<PECPoolApiResponse<FarmData>> {
    return this.#get<FarmData>('/v1/farm');
  }

  monitor(): Promise<PECPoolApiResponse<MonitorData>> {
    return this.#get<MonitorData>('/v1/monitor');
  }

  accounts(): Promise<PECPoolApiResponse<AccountSummary[]>> {
    return this.#get<AccountSummary[]>('/v1/accounts');
  }

  accountSummary(account: string): Promise<PECPoolApiResponse<AccountSummary>> {
    return this.#get<AccountSummary>(
      `/v1/accounts/${pathSegment(account)}/summary`,
    );
  }

  accountMonitor(
    account: string,
    workersPage = 1,
    workersPageSize = 100,
    minersPage = 1,
    minersPageSize = 100,
    hours = 24,
  ): Promise<PECPoolApiResponse<AccountMonitorData>> {
    requirePositiveInteger('workersPage', workersPage);
    requirePositiveInteger('workersPageSize', workersPageSize);
    requirePositiveInteger('minersPage', minersPage);
    requirePositiveInteger('minersPageSize', minersPageSize);
    requirePositiveInteger('hours', hours);

    return this.#get<AccountMonitorData>(
      `/v1/accounts/${pathSegment(account)}/monitor`,
      [
        ['workersPage', workersPage],
        ['workersPageSize', workersPageSize],
        ['minersPage', minersPage],
        ['minersPageSize', minersPageSize],
        ['hours', hours],
      ],
    );
  }

  workers(
    account: string,
    page = 1,
    pageSize = 100,
    includeCharts = false,
    hours = 24,
  ): Promise<PECPoolApiResponse<Worker[]>> {
    requirePositiveInteger('page', page);
    requirePositiveInteger('pageSize', pageSize);
    requirePositiveInteger('hours', hours);

    return this.#get<Worker[]>(`/v1/accounts/${pathSegment(account)}/workers`, [
      ['page', page],
      ['pageSize', pageSize],
      ['includeCharts', includeCharts],
      ['hours', hours],
    ]);
  }

  miners(
    account: string,
    page = 1,
    pageSize = 100,
    includeCharts = false,
    hours = 24,
  ): Promise<PECPoolApiResponse<Miner[]>> {
    requirePositiveInteger('page', page);
    requirePositiveInteger('pageSize', pageSize);
    requirePositiveInteger('hours', hours);

    return this.#get<Miner[]>(`/v1/accounts/${pathSegment(account)}/miners`, [
      ['page', page],
      ['pageSize', pageSize],
      ['includeCharts', includeCharts],
      ['hours', hours],
    ]);
  }

  earnings(
    account: string,
    page = 1,
    pageSize = 100,
  ): Promise<PECPoolApiResponse<Earning[]>> {
    requirePositiveInteger('page', page);
    requirePositiveInteger('pageSize', pageSize);

    return this.#get<Earning[]>(
      `/v1/accounts/${pathSegment(account)}/earnings`,
      [
        ['page', page],
        ['pageSize', pageSize],
      ],
    );
  }

  payouts(
    account: string,
    page = 1,
    pageSize = 100,
  ): Promise<PECPoolApiResponse<Payout[]>> {
    requirePositiveInteger('page', page);
    requirePositiveInteger('pageSize', pageSize);

    return this.#get<Payout[]>(
      `/v1/accounts/${pathSegment(account)}/payouts`,
      [
        ['page', page],
        ['pageSize', pageSize],
      ],
    );
  }

  accountHashrateChart(
    account: string,
    hours = 24,
  ): Promise<PECPoolApiResponse<ChartPoint[]>> {
    requirePositiveInteger('hours', hours);

    return this.#get<ChartPoint[]>(
      `/v1/accounts/${pathSegment(account)}/charts/hashrate`,
      [['hours', hours]],
    );
  }

  workerHashrateChart(
    account: string,
    worker: string,
    hours = 24,
  ): Promise<PECPoolApiResponse<ChartPoint[]>> {
    requirePositiveInteger('hours', hours);

    return this.#get<ChartPoint[]>(
      `/v1/accounts/${pathSegment(account)}/workers/${pathSegment(worker)}/charts/hashrate`,
      [['hours', hours]],
    );
  }

  minerHashrateChart(
    account: string,
    minerKey: string,
    hours = 24,
  ): Promise<PECPoolApiResponse<ChartPoint[]>> {
    requirePositiveInteger('hours', hours);

    return this.#get<ChartPoint[]>(
      `/v1/accounts/${pathSegment(account)}/miners/${pathSegment(minerKey)}/charts/hashrate`,
      [['hours', hours]],
    );
  }

  snapshot(
    hours = 24,
    includeCharts = true,
    earningsPageSize = 100,
    payoutsPageSize = 100,
  ): Promise<PECPoolApiResponse<SnapshotData>> {
    requirePositiveInteger('hours', hours);
    requirePositiveInteger('earningsPageSize', earningsPageSize);
    requirePositiveInteger('payoutsPageSize', payoutsPageSize);

    return this.#get<SnapshotData>('/v1/snapshot', [
      ['hours', hours],
      ['includeCharts', includeCharts],
      ['earningsPageSize', earningsPageSize],
      ['payoutsPageSize', payoutsPageSize],
    ]);
  }

  async #get<T>(
    path: string,
    query: readonly QueryEntry[] = [],
  ): Promise<PECPoolApiResponse<T>> {
    const queryString = buildQueryString(query);
    const authenticationHeaders = createAuthenticationHeaders({
      apiKey: this.#apiKey,
      apiSecret: this.#apiSecret,
      method: 'GET',
      path,
      queryString,
    });
    const url = new URL(
      `${PECPOOL_API_BASE_URL}${path}${queryString === '' ? '' : `?${queryString}`}`,
    );

    if (url.pathname !== path || url.search.slice(1) !== queryString) {
      throw new PECPoolApiError(
        'The final URL does not match the canonical path and query string.',
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);

    let response: Response;
    let responseText: string;

    try {
      response = await this.#fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PECPool-TypeScript-Example/1.0',
          ...authenticationHeaders,
        },
        redirect: 'error',
        signal: controller.signal,
      });
      responseText = await response.text();
    } catch {
      if (controller.signal.aborted) {
        throw new PECPoolApiError(
          `PECPool API request timed out after ${this.#timeoutMs} milliseconds.`,
        );
      }

      throw new PECPoolApiError(
        'A network error prevented the PECPool API request.',
      );
    } finally {
      clearTimeout(timeout);
    }

    const decoded = parseJson(responseText);

    if (!response.ok) {
      throw createApiError(response, decoded);
    }

    if (!isRecord(decoded)) {
      throw new PECPoolApiError(
        `PECPool API returned an unexpected JSON value (HTTP ${response.status}).`,
        { statusCode: response.status },
      );
    }

    if (decoded.success === false) {
      throw createApiError(response, decoded);
    }

    return decoded as PECPoolApiResponse<T>;
  }
}

function parseJson(value: string): unknown {
  if (value.trim() === '') {
    return undefined;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function createApiError(response: Response, decoded: unknown): PECPoolApiError {
  const errorBody = isRecord(decoded) ? decoded : {};
  const nestedError = isRecord(errorBody.error) ? errorBody.error : {};
  const apiErrorCode = firstString(
    errorBody.errorCode,
    errorBody.code,
    nestedError.code,
  );
  const message =
    firstString(errorBody.message, nestedError.message) ??
    `PECPool API request failed with HTTP ${response.status}.`;
  const retryAfterSeconds =
    nonNegativeInteger(errorBody.retryAfterSeconds) ??
    parseRetryAfter(response.headers.get('retry-after'));
  const serverTimeUtc = firstString(errorBody.serverTimeUtc);

  return new PECPoolApiError(message, {
    statusCode: response.status,
    ...(apiErrorCode === undefined ? {} : { apiErrorCode }),
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    ...(serverTimeUtc === undefined ? {} : { serverTimeUtc }),
  });
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === '') {
    return undefined;
  }

  const normalized = value.trim();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const retryAt = Date.parse(normalized);

  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1_000));
}

function nonNegativeInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
  }

  return undefined;
}

function firstString(...values: unknown[]): string | undefined {
  return values.find(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pathSegment(value: string): string {
  if (value.length === 0 || value === '.' || value === '..') {
    throw new TypeError('Path values must be non-empty and cannot be "." or "..".');
  }

  return encodeRfc3986(value);
}

function requirePositiveInteger(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${name} must be a positive safe integer.`);
  }
}
