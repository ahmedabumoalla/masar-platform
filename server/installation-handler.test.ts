import assert from 'node:assert/strict'
import test from 'node:test'
import { createInstallationHandler, type InstallationRecord } from './installation-handler.ts'

const data = { name: 'اختبار آلي', email: 'test@example.com', phone: '0500000000', mapsUrl: 'https://www.google.com/maps?q=24,46', deviceCount: '2', farmArea: '2500', plants: 'نخيل', requestId: 'ce251ac3-6417-4b9f-bb63-43341b887ad0', companyWebsite: '' }
const url = 'https://masar-platform-cyan.vercel.app/api/installation-requests'
function request(body: unknown = data, headers: Record<string, string> = {}) {
  return new Request(url, { method: 'POST', headers: { origin: new URL(url).origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
}

test('waits for durable storage and returns no contact data or private storage URL', async () => {
  let release!: () => void
  let saved!: { path: string; record: InstallationRecord }
  const pending = new Promise<void>(resolve => { release = resolve })
  const handler = createInstallationHandler(async (path, record) => { saved = { path, record }; await pending })
  let complete = false
  const result = handler(request()).then(response => { complete = true; return response })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(complete, false)
  release()
  const response = await result
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { success: true, requestId: data.requestId })
  assert.match(saved.path, /^installation-requests\/[a-f0-9]{64}\.json$/)
  assert.equal(saved.record.email, data.email)
  assert.equal(saved.record.status, 'new')
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('same submission retries have the same storage path; edited data has another path', async () => {
  const paths: string[] = []
  const handler = createInstallationHandler(async path => { paths.push(path) })
  await handler(request()); await handler(request()); await handler(request({ ...data, deviceCount: '3' }))
  assert.equal(paths[0], paths[1]); assert.notEqual(paths[0], paths[2])
})

test('rejects wrong methods, origins, content types, invalid and oversized bodies before storage', async () => {
  let writes = 0
  const handler = createInstallationHandler(async () => { writes++ })
  assert.equal((await handler(new Request(url))).status, 405)
  assert.equal((await handler(request(data, { origin: 'https://attacker.example' }))).status, 403)
  assert.equal((await handler(request(data, { 'Content-Type': 'text/plain' }))).status, 415)
  assert.equal((await handler(request({ ...data, plants: 'x'.repeat(13000) }))).status, 413)
  assert.equal((await handler(request({ ...data, companyWebsite: 'spam.example' }))).status, 400)
  assert.equal((await handler(request({ ...data, requestId: '../private' }))).status, 400)
  assert.equal((await handler(request({ ...data, deviceCount: '0', phone: 'bad' }))).status, 422)
  assert.equal(writes, 0)
})

test('storage errors never acknowledge success or expose internal error text', async () => {
  const handler = createInstallationHandler(async () => { throw new Error('private provider secret') })
  const response = await handler(request())
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { success: false })
})

test('bounds repeated submissions and allows requests again after the window', async () => {
  let time = Date.now(), writes = 0
  const handler = createInstallationHandler(async () => { writes++ }, () => time)
  for (let i = 0; i < 5; i++) assert.equal((await handler(request())).status, 201)
  const limited = await handler(request())
  assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 0)
  time += 600001
  assert.equal((await handler(request())).status, 201)
  assert.equal(writes, 6)
})
