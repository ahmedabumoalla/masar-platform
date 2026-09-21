import { useEffect, useRef, useState } from 'react'
import { CheckCheck, Droplets, FileText, TrendingDown, X } from 'lucide-react'
import { estimateSavings, type IncidentReport } from '../lib/incident-report'
import { ZONES } from '../lib/simulation'
import './incident-report.css'

const number = (value: number, digits = 1) => value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export default function IncidentReportDialog({ report, onClose }: { report: IncidentReport; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [price, setPrice] = useState('5')
  const [horizon, setHorizon] = useState(60)
  const estimate = price.trim() ? estimateSavings(report, Number(price), horizon) : null
  const zone = ZONES.find(item => item.id === report.zone)!
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => { element.close() }
  }, [])
  return <dialog ref={dialog} className="incident-report" aria-labelledby="report-title" aria-describedby="report-description" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="report-header"><span className="report-success"><CheckCheck size={25} /></span><div><span className="eyebrow">أُصلح التسريب · تقرير {number(report.id, 0)}</span><h2 id="report-title">كل قطرة نحافظ عليها تُحسب</h2></div><button autoFocus className="report-close" aria-label="إغلاق تقرير التسريب" onClick={onClose}><X size={21} /></button></div>
    <p id="report-description" className="report-description">القطاع {report.zone} · {zone.kind === 'buried' ? 'شبكة الري المدفونة' : 'شبكة الري الظاهرة'}<span>نتائج هذا التسريب وحده ضمن المحاكاة</span></p>
    <div className="report-loss"><span><Droplets size={19} /> الماء المفقود قبل إيقاف التسريب</span><strong className="mono">{number(report.waterLostLiters, 2)} <small>لتر</small></strong><p>من بداية هذا التسريب حتى عزله · لا يشمل التجارب السابقة</p></div>
    <dl className="report-timing"><div><dt>اكتشاف التسريب</dt><dd><b className="mono">{number(report.detectionSeconds)}</b> ثانية</dd></div><div><dt>عزل الفرع</dt><dd><b className="mono">{number(report.isolationSeconds)}</b> ثانية</dd></div><div><dt>اكتمال الإصلاح</dt><dd><b className="mono">{number(report.repairSeconds)}</b> ثانية</dd></div></dl>
    <p className="report-clock-note">جميع الأزمنة منذ بداية التسريب وبحسب ساعة المحاكاة</p>
    <div className="report-savings"><div className="report-section-title"><TrendingDown size={20} /><h3>ما الذي يمكن أن نتجنّب خسارته؟</h3></div><p>تقدير الهدر الإضافي لو استمر التسريب بعد العزل بنفس متوسطه المسجّل مع استمرار الضخ</p>
      <div className="report-assumptions"><label htmlFor="report-horizon">فترة المقارنة<select id="report-horizon" value={horizon} onChange={event => setHorizon(Number(event.target.value))}><option value="60">ساعة واحدة</option><option value="360">6 ساعات</option><option value="1440">24 ساعة</option></select></label><label htmlFor="report-price">تكلفة الماء المفترضة <span>ريال / م³</span><input id="report-price" type="number" inputMode="decimal" min="0" max="1000" step="0.01" value={price} aria-invalid={!estimate} aria-describedby="price-note" onChange={event => setPrice(event.target.value)} /></label></div>
      <p id="price-note" className={!estimate ? 'report-input-error' : 'report-assumption-note'}>{estimate ? '5 ريال/م³ قيمة افتراضية للتجربة وليست تعرفة رسمية · عدّلها حسب تكلفة الماء لديك' : 'أدخل تكلفة صالحة بين 0 و1000 ريال لكل متر مكعب'}</p>
      <div className="report-estimates" aria-live="polite"><div><span>ماء يُتوقّع تجنّب هدره</span><strong className="mono">{estimate ? number(estimate.avoidedLiters, 1) : '—'} <small>لتر</small></strong></div><div><span>التوفير المالي التقديري</span><strong className="mono">{estimate ? number(estimate.estimatedSavingsSar, 2) : '—'} <small>ريال</small></strong></div></div>
      <p className="report-formula">الماء المتوقع = متوسط التسريب × مدة المقارنة<br />المبلغ = الماء باللتر ÷ 1000 × تكلفة المتر المكعب</p>
    </div>
    <dl className="report-details"><div><dt>متوسط التسريب أثناء تدفق الماء</dt><dd>{number(report.averageLeakFlowLpm)} لتر/دقيقة</dd></div><div><dt>أعلى معدل تسريب مسجّل</dt><dd>{number(report.peakLeakFlowLpm)} لتر/دقيقة</dd></div><div><dt>أدنى ضغط للقطاع أثناء التسريب</dt><dd>{report.minimumPressureBar === null ? '—' : `${number(report.minimumPressureBar, 2)} بار`}</dd></div><div><dt>التكلفة التقديرية للماء المفقود</dt><dd>{estimate ? `${number(estimate.estimatedLossCostSar, 3)} ريال` : '—'}</dd></div></dl>
    <div className="report-footer"><span><FileText size={16} /> يمكنك فتح آخر تقرير من زر التقرير أسفل الخريطة</span><button className="button primary" onClick={onClose}>العودة إلى المزرعة</button></div>
  </dialog>
}
