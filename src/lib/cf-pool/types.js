// CFToken shape (JS — just objects, no interface)
// { id, email, accountId, token, status, addedAt, lastChecked, lastUsed, requestCount, latencyMs }

export const DEFAULT_SETTINGS = {
  minActive: 5,
  batchSize: 5,
  healthCheckIntervalMin: 15,
  cooldownMin: 30,
  autoReplenish: true,
  fallbackMode: 'auto',
}
