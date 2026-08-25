/**
 * Public response types described by the PECPool API v1 OpenAPI document.
 *
 * The OpenAPI schemas do not mark properties as required, so every property is
 * optional. Nullable public fields also include `null` explicitly.
 */

export interface PECPoolApiResponse<T> {
  success?: boolean;
  data?: T | null;
  pagination?: PaginationInfo | null;
  serverTimeUtc?: string | null;
  [key: string]: unknown;
}

export interface PaginationInfo {
  page?: number;
  pageSize?: number;
  totalRows?: number;
  totalPages?: number;
  hasNextPage?: boolean;
}

export interface PagedData<T> {
  items?: T[] | null;
  pagination?: PaginationInfo | null;
}

export interface PingData {
  service?: string | null;
  version?: string | null;
  serverTimeUtc?: string;
}

export interface FarmData {
  farmName?: string | null;
  active?: boolean;
  coin?: string | null;
  hashrateUnit?: string | null;
  totalAccounts?: number;
  totalWorkers?: number;
  onlineWorkers?: number;
  offlineWorkers?: number;
  totalMiners?: number;
  onlineMiners?: number;
  offlineMiners?: number;
  hashrateTHs?: number;
  hashrate1hTHs?: number;
  hashrate24hTHs?: number;
  balanceBTC?: string | null;
  balanceUSD?: string | null;
  paidBTC?: string | null;
  paidUSD?: string | null;
  waitingBTC?: string | null;
  waitingUSD?: string | null;
  lastUpdateUtc?: string | null;
}

export interface AccountSummary {
  account?: string | null;
  active?: boolean;
  hashrateTHs?: number;
  hashrate1hTHs?: number;
  hashrate24hTHs?: number;
  balanceBTC?: string | null;
  balanceUSD?: string | null;
  paidBTC?: string | null;
  paidUSD?: string | null;
  waitingBTC?: string | null;
  waitingUSD?: string | null;
  workersTotal?: number;
  workersOnline?: number;
  workersOffline?: number;
  minersTotal?: number;
  minersOnline?: number;
  minersOffline?: number;
  lastShareUtc?: string | null;
  lastUpdateUtc?: string | null;
}

export interface ChartPoint {
  timeUtc?: string;
  hashrateTHs?: number;
  rejectRate?: number | null;
  staleRate?: number | null;
  temperature?: number | null;
  power?: number | null;
}

export interface Worker {
  workerName?: string | null;
  status?: string | null;
  hashrateTHs?: number;
  hashrate1hTHs?: number;
  hashrate24hTHs?: number;
  rejected1h?: number;
  rejected24h?: number;
  lastShareUtc?: string | null;
  lastSeenUtc?: string | null;
  chart24h?: ChartPoint[] | null;
}

export interface Miner {
  minerKey?: string | null;
  minerName?: string | null;
  account?: string | null;
  status?: string | null;
  model?: string | null;
  hashrateTHs?: number;
  hashrate1mTHs?: number;
  hashrateAverageTHs?: number;
  temperature?: number;
  power?: number;
  fan0?: number;
  fan1?: number;
  poolWorker?: string | null;
  poolStatus?: string | null;
  accepted?: number;
  rejected?: number;
  uptimeSeconds?: number;
  lastSeenUtc?: string | null;
  chart24h?: ChartPoint[] | null;
}

export interface Earning {
  dateUtc?: string;
  earnBTC?: string | null;
  earnUSD?: string | null;
  hashrate24hTHs?: number;
  dayProfit?: number;
  coin?: string | null;
}

export interface Payout {
  dateUtc?: string;
  amountBTC?: string | null;
  amountUSD?: string | null;
  status?: string | null;
  txId?: string | null;
  walletMasked?: string | null;
  description?: string | null;
}

export interface MonitorData {
  farm?: FarmData | null;
  accounts?: AccountSummary[] | null;
}

export interface AccountMonitorData {
  summary?: AccountSummary | null;
  accountChart24h?: ChartPoint[] | null;
  workers?: PagedData<Worker> | null;
  miners?: PagedData<Miner> | null;
}

export interface AccountSnapshot {
  account?: string | null;
  active?: boolean;
  summary?: AccountSummary | null;
  accountChart24h?: ChartPoint[] | null;
  workers?: Worker[] | null;
  miners?: Miner[] | null;
  earnings?: PagedData<Earning> | null;
  payouts?: PagedData<Payout> | null;
}

export interface SnapshotData {
  farm?: FarmData | null;
  accounts?: AccountSnapshot[] | null;
}
