// Cloudflare Worker — DeepSeek API Proxy
// Key 存在 Worker Secret 里，永不下发浏览器
// 带 IP 限流（KV 计数），防盗刷

interface Env {
  DEEPSEEK_API_KEY: string
  RATE_LIMIT_KV: KVNamespace
  // 可选：每日额度，默认 500 次
  DAILY_QUOTA?: string
}

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1'
const DEFAULT_DAILY_QUOTA = 500

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown'

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return cors(preflightResponse())
    }

    // 健康检查
    if (url.pathname === '/health') {
      return cors(new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    // 只有 /v1/chat/completions 被允许
    if (request.method !== 'POST' || url.pathname !== '/v1/chat/completions') {
      return cors(new Response('Not Found', { status: 404 }))
    }

    // === 限流检查 ===
    const quota = parseInt(env.DAILY_QUOTA || String(DEFAULT_DAILY_QUOTA), 10)
    const dateKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const kvKey = `ratelimit:${clientIp}:${dateKey}`

    let usage = 0
    try {
      const val = await env.RATE_LIMIT_KV.get(kvKey)
      usage = val ? parseInt(val, 10) : 0
    } catch {
      // KV 不可用时不阻塞请求，但打印警告
      console.error('KV read failed, rate limiting disabled')
    }

    if (usage >= quota) {
      return cors(new Response(JSON.stringify({
        error: { message: `今日请求次数已达上限 (${quota}次)，明天再试`, type: 'rate_limit_error' },
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '86400' },
      }))
    }

    // === 转发到 DeepSeek ===
    try {
      const body = await request.json()

      const deepseekResponse = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
      })

      // 更新计数器（不 await，不阻塞响应）
      const increment = usage + 1
      env.RATE_LIMIT_KV.put(kvKey, String(increment), { expirationTtl: 86400 }).catch(e => console.error('KV write failed', e))

      // 如果 DeepSeek 返回错误，透传
      if (!deepseekResponse.ok) {
        const errorBody = await deepseekResponse.text()
        return cors(new Response(errorBody, {
          status: deepseekResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }))
      }

      // 流式响应 / 普通响应
      const contentType = deepseekResponse.headers.get('Content-Type') || ''
      if (body.stream) {
        // SSE 流式响应
        const { readable, writable } = new TransformStream()
        deepseekResponse.body!.pipeTo(writable).catch(() => {})
        return cors(new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }))
      }

      // 非流式：透传 JSON
      const data = await deepseekResponse.json()
      return cors(new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      }))

    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : '代理请求失败'
      return cors(new Response(JSON.stringify({
        error: { message: errMsg, type: 'proxy_error' },
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
  },
}

function preflightResponse(): Response {
  return new Response(null, { status: 204 })
}

function cors(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
