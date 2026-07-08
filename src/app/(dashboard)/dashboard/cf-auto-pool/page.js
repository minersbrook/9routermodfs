'use client'
import { useState, useEffect } from 'react'

export default function CFAutoPoolPage() {
  const [pool, setPool] = useState(null)
  const [gen, setGen] = useState(false)

  useEffect(() => {
    const poll = async () => { try { setPool((await (await fetch('/api/cf-pool/status')).json())) } catch {} }
    poll(); const iv = setInterval(poll, 10000); return () => clearInterval(iv)
  }, [])

  const handleGen = async () => {
    setGen(true)
    try { await fetch('/api/cf-pool/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 5 }) }) } catch {}
    setGen(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🤖 CF Auto-Pool</h1>
        <button onClick={handleGen} disabled={gen} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {gen ? 'Generating...' : 'Generate Now'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg"><div className="text-3xl font-bold text-green-600">{pool?.active ?? 0}</div><div className="text-sm text-gray-500">Active ✅</div></div>
        <div className="p-4 bg-yellow-50 rounded-lg"><div className="text-3xl font-bold text-yellow-600">{pool?.cooldown ?? 0}</div><div className="text-sm text-gray-500">Cooldown ⏳</div></div>
        <div className="p-4 bg-red-50 rounded-lg"><div className="text-3xl font-bold text-red-600">{pool?.banned ?? 0}</div><div className="text-sm text-gray-500">Banned ❌</div></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Email</th><th className="px-4 py-2 text-left">Account ID</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Req</th></tr></thead>
          <tbody>
            {(pool?.tokens ?? []).map((t) => (
              <tr key={t.id} className="border-t"><td className="px-4 py-2">{t.email}</td><td className="px-4 py-2 font-mono text-xs">{t.accountId?.slice(0, 8)}...</td><td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${t.status === 'active' ? 'bg-green-100 text-green-700' : t.status === 'cooldown' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span></td><td className="px-4 py-2">{t.requestCount}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
