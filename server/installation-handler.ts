import { createHash } from 'node:crypto'
import { validateInstallationRequest, type InstallationValues } from '../src/lib/installation-request.js'

export type InstallationRecord = InstallationValues & { requestId: string; receivedAt: string; status: 'new' }
type SaveRequest = (path: string, record: InstallationRecord) => Promise<void>
const maximumBytes = 12 * 1024
const response = (status: number, body: object, extra: Record<string, string> = {}) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
})

/** The store is private. This public intake exposes neither list nor read operations. */
export function createInstallationHandler(save: SaveRequest, now = () => Date.now()) {
  // Bounded, per-instance burst protection, supplemented by Vercel's platform firewall.
  const recent = new Map<string, { count: number; until: number }>()
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return response(405, { success: false }, { Allow: 'POST' })
    const origin = request.headers.get('origin')
    if (!origin || origin !== new URL(request.url).origin) return response(403, { success: false })
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return response(415, { success: false })
    if (Number(request.headers.get('content-length')) > maximumBytes) return response(413, { success: false })
    let input: unknown
    try {
      const reader = request.body?.getReader()
      if (!reader) return response(400, { success: false })
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maximumBytes) { await reader.cancel(); return response(413, { success: false }) }
        chunks.push(value)
      }
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch { return response(400, { success: false }) }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return response(400, { success: false })
    const data = input as Record<string, unknown>
    if (data.companyWebsite !== '' || typeof data.requestId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(data.requestId)) return response(400, { success: false })
    const { values, errors } = validateInstallationRequest(input)
    if (Object.keys(errors).length) return response(422, { success: false, errors })
    const timestamp = now()
    for (const [key, entry] of recent) if (entry.until <= timestamp) recent.delete(key)
    const ip = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
    const client = createHash('sha256').update(ip).digest('hex')
    const rate = recent.get(client)
    if (rate && rate.count >= 5) return response(429, { success: false }, { 'Retry-After': String(Math.ceil((rate.until - timestamp) / 1000)) })
    if (!rate && recent.size >= 5000) return response(429, { success: false }, { 'Retry-After': '60' })
    recent.set(client, { count: (rate?.count ?? 0) + 1, until: rate?.until ?? timestamp + 10 * 60 * 1000 })
    const requestId = data.requestId.toLowerCase()
    // Same request/data yields the same private object even when a response is lost and retried.
    const fingerprint = createHash('sha256').update(JSON.stringify({ requestId, ...values })).digest('hex')
    try {
      await save(`installation-requests/${fingerprint}.json`, { ...values, requestId, receivedAt: new Date(timestamp).toISOString(), status: 'new' })
      return response(201, { success: true, requestId })
    } catch {
      // Never echo submitted personal information or storage/provider details into errors or logs.
      return response(503, { success: false })
    }
  }
}
