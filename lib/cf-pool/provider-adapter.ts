import { CFPoolManager } from './pool-manager'

export async function cfAIProvider(request: any, model: string) {
  const pool = CFPoolManager.getInstance()
  for (let i = 0; i < pool.activeCount + 1; i++) {
    const token = pool.getNextToken()
    if (!token) break
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${token.accountId}/ai/v1/chat/completions`,
        { method: 'POST', headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model.replace('cf/', ''), messages: request.messages, stream: false }) }
      )
      if (res.status === 429) { pool.markFailed(token.id, 429); continue }
      if (res.status === 401) { pool.markFailed(token.id, 401); continue }
      if (!res.ok) return new Response(JSON.stringify({ error: 'CF API error' }), { status: res.status })
      const data = await res.json()
      return streamToClient(data, request.stream)
    } catch { pool.markFailed(token.id, 500); continue }
  }
  return null
}

function streamToClient(data: any, shouldStream: boolean) {
  if (!shouldStream) return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  const content = data.choices?.[0]?.message?.content || ''
  const encoder = new TextEncoder()
  const stream = new ReadableStream({ start(controller) {
    const words = content.split(' ')
    let i = 0
    const send = () => {
      if (i >= words.length) { controller.enqueue(encoder.encode('data: [DONE]\n\n')); controller.close(); return }
      const chunk = (i === 0 ? '' : ' ') + words[i++]
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk }, index: 0 }] })}\n\n`))
      setTimeout(send, 10)
    }
    send()
  }})
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
