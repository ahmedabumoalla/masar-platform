import assert from 'node:assert/strict'
import test from 'node:test'
import { isGoogleMapsUrl, validateInstallationRequest } from './installation-request.ts'

const valid = { name: 'اختبار مسار', email: 'test@example.com', phone: '0500000000', mapsUrl: 'https://maps.app.goo.gl/example', deviceCount: '2', farmArea: '2500', plants: 'نخيل' }

test('normalizes Arabic and Persian digits and trims contact details', () => {
  const { values, errors } = validateInstallationRequest({ ...valid, name: ' اختبار مسار ', phone: '+٩٦٦ ٥٠ ٠٠٠ ٠٠٠٠', deviceCount: '۲', farmArea: '٢٥٠٠٫٥٠' })
  assert.deepEqual(errors, {})
  assert.equal(values.phone, '+966500000000')
  assert.equal(values.deviceCount, '2')
  assert.equal(values.farmArea, '2500.50')
})

test('requires all seven fields and rejects invalid numerical ranges and partial numbers', () => {
  assert.equal(Object.keys(validateInstallationRequest({}).errors).length, 7)
  for (const deviceCount of ['0', '-1', '1.5', '1e2', '12 devices', '10001']) assert.ok(validateInstallationRequest({ ...valid, deviceCount }).errors.deviceCount)
  for (const farmArea of ['0', '-5', 'Infinity', '12m2', '0.001', '1000000001']) assert.ok(validateInstallationRequest({ ...valid, farmArea }).errors.farmArea)
  assert.ok(validateInstallationRequest({ ...valid, email: 'a@b', phone: '123', name: '<script>', plants: 'a'.repeat(501) }).errors.email)
})

test('Google Maps allowlist rejects script URLs, deceptive hosts and credentials', () => {
  for (const url of ['https://maps.app.goo.gl/test', 'https://goo.gl/maps/test', 'https://www.google.com/maps?q=24,46', 'https://maps.google.com/?q=24,46']) assert.equal(isGoogleMapsUrl(url), true)
  for (const url of ['javascript:alert(1)', 'http://maps.google.com', 'https://maps.app.goo.gl.attacker.com/test', 'https://google.com/search', 'https://google.com@attacker.com/maps', 'https://user:pass@google.com/maps', 'https://google.com:123/maps']) assert.equal(isGoogleMapsUrl(url), false)
})
