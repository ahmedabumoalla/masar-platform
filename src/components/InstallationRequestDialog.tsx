import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUpLeft, Check, LoaderCircle, MapPin, Wrench, X } from 'lucide-react'
import { emptyInstallationValues, validateInstallationRequest, type InstallationErrors, type InstallationField } from '../lib/installation-request'
import './installation-request.css'

const labels: Record<InstallationField, string> = {
  name: 'اسم مقدم الطلب', email: 'البريد الإلكتروني', phone: 'رقم الجوال', mapsUrl: 'رابط موقع المزرعة في خرائط Google',
  deviceCount: 'عدد الأجهزة المطلوبة', farmArea: 'مساحة المزرعة بالمتر المربع', plants: 'أنواع النباتات والمحاصيل',
}

export default function InstallationRequestDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const successHeading = useRef<HTMLHeadingElement>(null)
  const sending = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const attempt = useRef({ data: '', id: '' })
  const honeypot = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState({ ...emptyInstallationValues })
  const [errors, setErrors] = useState<InstallationErrors>({})
  const [status, setStatus] = useState<'editing' | 'sending' | 'success'>('editing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const element = dialog.current!
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      controller.current?.abort()
      element.close()
      document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => { if (status === 'success') successHeading.current?.focus() }, [status])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    const validated = validateInstallationRequest(values)
    setErrors(validated.errors)
    setMessage('')
    if (Object.keys(validated.errors).length) {
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    sending.current = true
    setStatus('sending')
    controller.current = new AbortController()
    const data = JSON.stringify(validated.values)
    if (attempt.current.data !== data) attempt.current = { data, id: crypto.randomUUID() }
    const timeout = window.setTimeout(() => controller.current?.abort(), 20000)
    try {
      const response = await fetch('/api/installation-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validated.values, requestId: attempt.current.id, companyWebsite: honeypot.current?.value ?? '' }), signal: controller.current.signal,
      })
      const result: unknown = await response.json()
      if (!response.ok || !result || typeof result !== 'object' || !('success' in result) || result.success !== true) throw new Error('Submission not confirmed')
      setValues({ ...emptyInstallationValues })
      setStatus('success')
    } catch {
      setStatus('editing')
      setMessage('تعذر تأكيد إرسال الطلب الآن، بياناتك ما زالت هنا ويمكنك المحاولة مرة أخرى')
      requestAnimationFrame(() => summary.current?.focus())
    } finally {
      window.clearTimeout(timeout)
      sending.current = false
    }
  }

  function field(name: InstallationField, options: { type?: string; placeholder?: string; autoComplete?: string; inputMode?: 'text' | 'tel' | 'email' | 'url' | 'numeric' | 'decimal'; maxLength?: number; wide?: boolean } = {}) {
    return <div className={`installation-field${options.wide ? ' installation-wide' : ''}`}>
      <label htmlFor={`installation-${name}`}>{labels[name]}</label>
      <input id={`installation-${name}`} name={name} type={options.type ?? 'text'} inputMode={options.inputMode}
        autoComplete={options.autoComplete ?? 'off'} placeholder={options.placeholder} required maxLength={options.maxLength}
        dir={['email', 'phone', 'mapsUrl', 'deviceCount', 'farmArea'].includes(name) ? 'ltr' : 'auto'}
        value={values[name]} onChange={event => setValues(previous => ({ ...previous, [name]: event.target.value }))}
        aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `installation-${name}-error` : name === 'mapsUrl' ? 'installation-map-hint' : undefined} />
      {errors[name] && <span id={`installation-${name}-error`} className="installation-field-error">{errors[name]}</span>}
      {name === 'mapsUrl' && <span id="installation-map-hint" className="installation-field-hint">من خرائط Google اختر موقع المزرعة ثم مشاركة ونسخ الرابط <a href="https://maps.google.com" target="_blank" rel="noreferrer">افتح الخريطة <ArrowUpLeft size={13} aria-hidden="true" /></a></span>}
    </div>
  }

  return <dialog ref={dialog} className="installation-dialog" aria-labelledby="installation-title"
    onCancel={event => { event.preventDefault(); if (!sending.current) onClose() }}>
    <header className="installation-heading">
      <div><span className="installation-kicker"><Wrench size={15} aria-hidden="true" /> مسار في مزرعتك</span><h2 id="installation-title">طلب تركيب الجهاز</h2></div>
      <button className="installation-close" type="button" autoFocus aria-label="إغلاق طلب التركيب" disabled={status === 'sending'} onClick={onClose}><X size={21} /></button>
    </header>
    {status === 'success' ? <div className="installation-success" role="status">
      <span className="installation-success-icon"><Check size={27} aria-hidden="true" /></span>
      <h3 tabIndex={-1} ref={successHeading}>شكرًا، تم تقديم طلبكم بنجاح</h3>
      <p>وصلتنا بيانات المزرعة وطلب تركيب الجهاز</p>
      <button className="button primary" type="button" onClick={onClose}>العودة للرئيسية <ArrowUpLeft size={18} aria-hidden="true" /></button>
    </div> : <form className="installation-form" noValidate onSubmit={submit} aria-busy={status === 'sending'}>
      <div className="installation-body">
        <div className="installation-honeypot" aria-hidden="true"><label>اترك هذا الحقل فارغًا<input ref={honeypot} name="companyWebsite" tabIndex={-1} autoComplete="off" /></label></div>
        <p className="installation-intro">عرّفنا بمزرعتك لنبدأ ترتيب طلب التركيب <span>جميع الحقول مطلوبة</span></p>
        {(message || Object.keys(errors).length > 0) && <div className="installation-errors" ref={summary} tabIndex={-1} role="alert">
          {message || <><strong>راجع البيانات التالية لإكمال الطلب</strong><ul>{Object.entries(errors).map(([name, error]) => <li key={name}><a href={`#installation-${name}`}>{error}</a></li>)}</ul></>}
        </div>}
        <fieldset disabled={status === 'sending'}><legend>بيانات مقدم الطلب</legend><div className="installation-grid">
          {field('name', { autoComplete: 'name', maxLength: 120, wide: true, placeholder: 'الاسم الكامل' })}
          {field('phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', maxLength: 22, placeholder: '05xxxxxxxx' })}
          {field('email', { type: 'email', inputMode: 'email', autoComplete: 'email', maxLength: 254, placeholder: 'name@example.com' })}
        </div></fieldset>
        <fieldset disabled={status === 'sending'}><legend><MapPin size={15} aria-hidden="true" /> المزرعة والأجهزة</legend><div className="installation-grid">
          {field('mapsUrl', { type: 'url', inputMode: 'url', maxLength: 2048, placeholder: 'https://maps.app.goo.gl/…', wide: true })}
          {field('deviceCount', { inputMode: 'numeric', maxLength: 5, placeholder: '1' })}
          {field('farmArea', { inputMode: 'decimal', maxLength: 13, placeholder: 'مثال 2500' })}
          {field('plants', { maxLength: 500, wide: true, placeholder: 'مثال النخيل والحمضيات والخضروات' })}
        </div></fieldset>
      </div>
      <footer className="installation-footer"><p>تُستخدم بياناتك للتواصل بخصوص طلب التركيب</p><button className="button primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? <><LoaderCircle size={18} className="installation-spinner" aria-hidden="true" /> جارٍ إرسال الطلب</> : <>تقديم طلب التركيب <ArrowUpLeft size={18} aria-hidden="true" /></>}
      </button></footer>
    </form>}
  </dialog>
}
