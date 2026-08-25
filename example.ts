import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import { PECPoolApiClient } from './PECPoolApiClient.js';
import { PECPoolApiError } from './PECPoolApiError.js';
import type { PECPoolApiResponse } from './PECPoolTypes.js';

const environmentFile = resolve(process.cwd(), '.env');

const knownCommands = new Set([
  'ping',
  'farm',
  'monitor',
  'accounts',
  'snapshot',
  'account-summary',
  'account-monitor',
  'workers',
  'miners',
  'earnings',
  'payouts',
  'account-chart',
  'worker-chart',
  'miner-chart',
]);

async function main(): Promise<void> {
  const [rawCommand = 'help', ...arguments_] = process.argv.slice(2);
  const command = rawCommand.toLowerCase();

  if (command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (!knownCommands.has(command)) {
    throw new UsageError(`Unknown command "${command}".`);
  }

  if (existsSync(environmentFile)) {
    loadEnvFile(environmentFile);
  }

  const apiKey = requiredEnvironmentValue('PECPOOL_API_KEY');
  const apiSecret = requiredEnvironmentValue('PECPOOL_API_SECRET');
  const timeoutSeconds = optionalEnvironmentInteger(
    'PECPOOL_API_TIMEOUT',
    30,
    1,
    300,
  );
  const client = new PECPoolApiClient(apiKey, apiSecret, {
    timeoutMs: timeoutSeconds * 1_000,
  });
  const result = await executeCommand(client, command, arguments_);

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function executeCommand(
  client: PECPoolApiClient,
  command: string,
  arguments_: string[],
): Promise<PECPoolApiResponse<unknown>> {
  switch (command) {
    case 'ping':
      expectArgumentCount(arguments_, 0, 0);
      return client.ping();

    case 'farm':
      expectArgumentCount(arguments_, 0, 0);
      return client.farm();

    case 'monitor':
      expectArgumentCount(arguments_, 0, 0);
      return client.monitor();

    case 'accounts':
      expectArgumentCount(arguments_, 0, 0);
      return client.accounts();

    case 'snapshot':
      expectArgumentCount(arguments_, 0, 4);
      return client.snapshot(
        optionalPositiveInteger(arguments_, 0, 24, 'hours'),
        optionalBoolean(arguments_, 1, true, 'includeCharts'),
        optionalPositiveInteger(arguments_, 2, 100, 'earningsPageSize'),
        optionalPositiveInteger(arguments_, 3, 100, 'payoutsPageSize'),
      );

    case 'account-summary':
      expectArgumentCount(arguments_, 1, 1);
      return client.accountSummary(
        requiredArgument(arguments_, 0, 'account'),
      );

    case 'account-monitor':
      expectArgumentCount(arguments_, 1, 6);
      return client.accountMonitor(
        requiredArgument(arguments_, 0, 'account'),
        optionalPositiveInteger(arguments_, 1, 1, 'workersPage'),
        optionalPositiveInteger(arguments_, 2, 100, 'workersPageSize'),
        optionalPositiveInteger(arguments_, 3, 1, 'minersPage'),
        optionalPositiveInteger(arguments_, 4, 100, 'minersPageSize'),
        optionalPositiveInteger(arguments_, 5, 24, 'hours'),
      );

    case 'workers':
      expectArgumentCount(arguments_, 1, 5);
      return client.workers(
        requiredArgument(arguments_, 0, 'account'),
        optionalPositiveInteger(arguments_, 1, 1, 'page'),
        optionalPositiveInteger(arguments_, 2, 100, 'pageSize'),
        optionalBoolean(arguments_, 3, false, 'includeCharts'),
        optionalPositiveInteger(arguments_, 4, 24, 'hours'),
      );

    case 'miners':
      expectArgumentCount(arguments_, 1, 5);
      return client.miners(
        requiredArgument(arguments_, 0, 'account'),
        optionalPositiveInteger(arguments_, 1, 1, 'page'),
        optionalPositiveInteger(arguments_, 2, 100, 'pageSize'),
        optionalBoolean(arguments_, 3, false, 'includeCharts'),
        optionalPositiveInteger(arguments_, 4, 24, 'hours'),
      );

    case 'earnings':
      expectArgumentCount(arguments_, 1, 3);
      return client.earnings(
        requiredArgument(arguments_, 0, 'account'),
        optionalPositiveInteger(arguments_, 1, 1, 'page'),
        optionalPositiveInteger(arguments_, 2, 100, 'pageSize'),
      );

    case 'payouts':
      expectArgumentCount(arguments_, 1, 3);
      return client.payouts(
        requiredArgument(arguments_, 0, 'account'),
        optionalPositiveInteger(arguments_, 1, 1, 'page'),
        optionalPositiveInteger(arguments_, 2, 100, 'pageSize'),
      );

    case 'account-chart':
      expectArgumentCount(arguments_, 1, 2);
      return client.accountHashrateChart(
        requiredArgument(arguments_, 0, 'account'),
        optionalPositiveInteger(arguments_, 1, 24, 'hours'),
      );

    case 'worker-chart':
      expectArgumentCount(arguments_, 2, 3);
      return client.workerHashrateChart(
        requiredArgument(arguments_, 0, 'account'),
        requiredArgument(arguments_, 1, 'worker'),
        optionalPositiveInteger(arguments_, 2, 24, 'hours'),
      );

    case 'miner-chart':
      expectArgumentCount(arguments_, 2, 3);
      return client.minerHashrateChart(
        requiredArgument(arguments_, 0, 'account'),
        requiredArgument(arguments_, 1, 'minerKey'),
        optionalPositiveInteger(arguments_, 2, 24, 'hours'),
      );

    default:
      throw new UsageError(`Unknown command "${command}".`);
  }
}

function expectArgumentCount(
  arguments_: string[],
  minimum: number,
  maximum: number,
): void {
  if (arguments_.length < minimum || arguments_.length > maximum) {
    const expected =
      minimum === maximum ? String(minimum) : `${minimum} to ${maximum}`;
    throw new UsageError(
      `This command expects ${expected} argument(s); ${arguments_.length} provided.`,
    );
  }
}

function requiredArgument(
  arguments_: string[],
  index: number,
  name: string,
): string {
  const value = arguments_[index]?.trim() ?? '';

  if (value.length === 0) {
    throw new UsageError(`${name} is required.`);
  }

  return value;
}

function optionalPositiveInteger(
  arguments_: string[],
  index: number,
  defaultValue: number,
  name: string,
): number {
  const value = arguments_[index];

  if (value === undefined) {
    return defaultValue;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new UsageError(`${name} must be a positive integer.`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new UsageError(`${name} must be a positive safe integer.`);
  }

  return parsed;
}

function optionalBoolean(
  arguments_: string[],
  index: number,
  defaultValue: boolean,
  name: string,
): boolean {
  const value = arguments_[index]?.toLowerCase();

  if (value === undefined) {
    return defaultValue;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new UsageError(`${name} must be true or false.`);
}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    throw new UsageError(`${name} is not configured.`);
  }

  return value;
}

function optionalEnvironmentInteger(
  name: string,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    return defaultValue;
  }

  if (!/^\d+$/.test(value)) {
    throw new UsageError(
      `${name} must be an integer from ${minimum} to ${maximum}.`,
    );
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new UsageError(
      `${name} must be an integer from ${minimum} to ${maximum}.`,
    );
  }

  return parsed;
}

function printUsage(): void {
  process.stdout.write(`PECPool API TypeScript / Node.js example

Usage:
  npm run cli -- <command> [arguments]

Commands (one API request per invocation):
  ping
  farm
  monitor
  accounts
  snapshot [hours=24] [includeCharts=true] [earningsPageSize=100] [payoutsPageSize=100]
  account-summary <account>
  account-monitor <account> [workersPage=1] [workersPageSize=100] [minersPage=1] [minersPageSize=100] [hours=24]
  workers <account> [page=1] [pageSize=100] [includeCharts=false] [hours=24]
  miners <account> [page=1] [pageSize=100] [includeCharts=false] [hours=24]
  earnings <account> [page=1] [pageSize=100]
  payouts <account> [page=1] [pageSize=100]
  account-chart <account> [hours=24]
  worker-chart <account> <worker> [hours=24]
  miner-chart <account> <minerKey> [hours=24]

Configuration:
  Set PECPOOL_API_KEY and PECPOOL_API_SECRET in the environment or in a local
  .env file copied from .env.example. PECPOOL_API_TIMEOUT is optional.

The API permits one request every 10 seconds per Farm Key.
`);
}

class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

main().catch((error: unknown) => {
  if (error instanceof PECPoolApiError) {
    const status =
      error.statusCode === 0 ? 'transport error' : `HTTP ${error.statusCode}`;
    const errorCode =
      error.apiErrorCode === undefined ? '' : `, ${error.apiErrorCode}`;

    process.stderr.write(
      `PECPool API error (${status}${errorCode}): ${error.message}\n`,
    );

    if (error.retryAfterSeconds !== undefined) {
      process.stderr.write(
        `Retry after ${error.retryAfterSeconds} second(s) with a newly signed request.\n`,
      );
    }

    process.exitCode = 1;
    return;
  }

  if (error instanceof UsageError || error instanceof TypeError) {
    process.stderr.write(`Configuration or usage error: ${error.message}\n`);
    process.stderr.write(
      'Run `npm run cli -- help` for command usage.\n',
    );
    process.exitCode = 2;
    return;
  }

  process.stderr.write('Unexpected error while running the example.\n');
  process.exitCode = 1;
});
