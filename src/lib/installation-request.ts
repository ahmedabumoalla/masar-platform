export const installationFields = ['name', 'email', 'phone', 'mapsUrl', 'deviceCount', 'farmArea', 'plants'] as const
export type InstallationField = typeof installationFields[number]
export type InstallationValues = Record<InstallationField, string>
export type InstallationErrors = Partial<Record<InstallationField, string>>

export const emptyInstallationValues: InstallationValues = {
  name: '', email: '', phone: '', mapsUrl: '', deviceCount: '1', farmArea: '', plants: '',
}

const westernDigits = (value: string) => value.replace(/[٠-٩۰-۹]/g, character =>
  String(character.charCodeAt(0) - (character <= '٩' ? 0x660 : 0x6f0))).replace(/٫/g, '.')

export function isGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false
    if (url.hostname === 'maps.app.goo.gl') return url.pathname.length > 1
    if (url.hostname === 'goo.gl') return url.pathname.startsWith('/maps/') && url.pathname.length > 6
    if (['maps.google.com', 'maps.google.com.sa'].includes(url.hostname)) return true
    return ['google.com', 'www.google.com', 'google.com.sa', 'www.google.com.sa'].includes(url.hostname)
      && /^\/maps(?:\/|$)/.test(url.pathname)
  } catch { return false }
}

export function validateInstallationRequest(input: unknown): { values: InstallationValues; errors: InstallationErrors } {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const values = Object.fromEntries(installationFields.map(field => [field,
    typeof source[field] === 'string' ? source[field].trim() : '',
  ])) as InstallationValues
  values.phone = westernDigits(values.phone).replace(/[\s()-]/g, '')
  values.deviceCount = westernDigits(values.deviceCount)
  values.farmArea = westernDigits(values.farmArea)
  const errors: InstallationErrors = {}
  if (values.name.length < 2 || values.name.length > 120 || /[\r\n<>]/.test(values.name)) errors.name = 'اكتب اسم مقدم الطلب من حرفين إلى 120 حرفًا'
  if (values.email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(values.email)) errors.email = 'اكتب بريدًا إلكترونيًا صحيحًا مثل name@example.com'
  if (!/^(?:05\d{8}|\+9665\d{8}|009665\d{8})$/.test(values.phone)) errors.phone = 'اكتب رقم جوال سعودي يبدأ بـ 05 أو +9665'
  if (values.mapsUrl.length > 2048 || !isGoogleMapsUrl(values.mapsUrl)) errors.mapsUrl = 'الصق رابط موقع المزرعة من خرائط Google'
  if (!/^\d+$/.test(values.deviceCount) || Number(values.deviceCount) < 1 || Number(values.deviceCount) > 10000) errors.deviceCount = 'اكتب عددًا صحيحًا من 1 إلى 10000 جهاز'
  if (!/^\d+(?:\.\d{1,2})?$/.test(values.farmArea) || Number(values.farmArea) <= 0 || Number(values.farmArea) > 1000000000) errors.farmArea = 'اكتب مساحة موجبة بالمتر المربع، حتى منزلتين عشريتين'
  if (values.plants.length < 2 || values.plants.length > 500) errors.plants = 'اذكر أنواع النباتات أو المحاصيل، حتى 500 حرف'
  return { values, errors }
}
