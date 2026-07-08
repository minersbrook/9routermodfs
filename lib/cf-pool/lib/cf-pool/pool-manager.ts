import { CFToken, CFPoolSettings, DEFAULT_SETTINGS } from './types'

let poolInstance: CFPoolManager | null = null

export class CFPoolManager {
  private tokens: Map<string, CFToken> = new Map()
  private roundRobinIndex = 0
  private settings: CFPoolSettings = DEFAULT_SETTINGS
  private generating = false
  private healthCheckTimer: NodeJS.Timeout | null = null
  private afcUrl: string

  constructor() {
    this.afcUrl = process.env.AUTOFREECF_URL || ''
    this.startHealthCheckLoop()
  }

  static getInstance(): CFPoolManager {
    if (!poolInstance) poolInstance = new CFPoolManager()
    return poolInstance
  }

  getNextToken(): CFToken | null {
    const active = [...this.tokens.values()]
      .filter(t => t.status === 'active')
      .sort((a, b) => a.lastUsed - b.lastUsed)
    if (active.length === 0) { this.triggerReplenish(); return null }
    const token = active[this.roundRobinIndex++ % active.length]
    token.lastUsed = Date.now()
    token.requestCount++
    return token
  }

  markFailed(tokenId: string, statusCode: number) {
    const token = this.tokens.get(tokenId)
    if (!token) return
    if (statusCode === 401) { token.status = 'banned'; this.tokens.delete(tokenId) }
    else if (statusCode === 429) {
      token.status = 'cooldown'; token.lastChecked = Date.now()
      setTimeout(() => { const t = this.tokens.get(tokenId); if (t) t.status = 'active' }, this.settings.cooldownMin * 60000)
    }
    if (this.activeCount < this.settings.minActive) this.triggerReplenish()
  }

  async generateNow(count: number): Promise<any> {
    if (this.generating) return { error: 'Already generating' }
    this.generating = true
    try {
      const res = await fetch(`${this.afcUrl}/api/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      })
      if (!res.ok) throw new Error(`Auto-FreeCF ${res.status}`)
      const results = await res.json()
      for (const r of results) {
        if (r.valid) this.tokens.set(r.token, {
          id: crypto.randomUUID(), email: r.email, accountId: r.account_id,
          token: r.token, status: 'active', addedAt: Date.now(),
          lastChecked: Date.now(), lastUsed: 0, requestCount: 0,
        })
      }
      return { generated: results.length, results }
    } catch (err) { return { error: err instanceof Error ? err.message : 'Unknown' } }
    finally { this.generating = false }
  }

  private async triggerReplenish() {
    if (!this.settings.autoReplenish || this.generating) return
    if (this.activeCount >= this.settings.minActive) return
    await this.generateNow(Math.min(this.settings.minActive - this.activeCount, this.settings.batchSize))
  }

  private async runHealthCheck() {
    const now = Date.now()
    for (const token of this.tokens.values()) {
      if (now - token.lastChecked < this.settings.healthCheckIntervalMin * 60000) continue
      try {
        const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify',
          { headers: { Authorization: `Bearer ${token.token}` } })
        if (!res.ok) this.tokens.delete(token.id)
        else token.lastChecked = now
      } catch {}
    }
    if (this.activeCount < this.settings.minActive) this.triggerReplenish()
  }

  private startHealthCheckLoop() {
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer)
    this.healthCheckTimer = setInterval(() => this.runHealthCheck(), this.settings.healthCheckIntervalMin * 60000)
  }

  get activeCount() { return [...this.tokens.values()].filter(t => t.status === 'active').length }
  get status() {
    return {
      active: this.activeCount,
      cooldown: [...this.tokens.values()].filter(t => t.status === 'cooldown').length,
      banned: [...this.tokens.values()].filter(t => t.status === 'banned').length,
      total: this.tokens.size, tokens: [...this.tokens.values()],
    }
  }
}
