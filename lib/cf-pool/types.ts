export interface CFToken {
  id: string
  email: string
  accountId: string
  token: string
  status: 'active' | 'cooldown' | 'banned'
  addedAt: number
  lastChecked: number
  lastUsed: number
  requestCount: number
  latencyMs?: number
}

export interface CFPoolSettings {
  minActive: number
  batchSize: number
  healthCheckIntervalMin: number
  cooldownMin: number
  autoReplenish: boolean
  fallbackMode: 'auto' | 'wait' | 'stop'
}

export const DEFAULT_SETTINGS: CFPoolSettings = {
  minActive: 5,
  batchSize: 5,
  healthCheckIntervalMin: 15,
  cooldownMin: 30,
  autoReplenish: true,
  fallbackMode: 'auto',
}
