import { lazy, Suspense, useEffect, useRef, useState, type Dispatch } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowLeft, ArrowUpLeft, BellRing, Check, CircleHelp, Cpu, Droplets, FileText, Focus, Gauge, Layers3, LocateFixed, Map, Pause, Play, Radio, RotateCcw, ScanLine, ShieldCheck, SlidersHorizontal, Waves, Wrench } from 'lucide-react'
import { getReadings, ZONES, type SimulationAction, type SimulationState } from '../lib/simulation'
import IncidentReportDialog from './IncidentReportDialog'
import SimulationPanel from './SimulationPanel'
import './simulation.css'

const FarmViewer = lazy(() => import('./FarmViewer'))
const format = (value: number, decimals = 1) => value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
type Panel = 'experiment' | 'telemetry' | 'view' | 'report' | null
type Camera = 'perspective' | 'top' | 'focus'
const phases = [
  { key: 'normal', title: 'تدفق طبيعي', icon: Waves },
  { key: 'leaking', title: 'حدوث التسريب', icon: Droplets },
  { key: 'analyzing', title: 'تحليل القراءات', icon: ScanLine },
  { key: 'detected', title: 'تحديد الفرع', icon: LocateFixed },
  { key: 'isolated', title: 'إيقاف الهدر', icon: ShieldCheck },
] as const

function Sparkline({ samples }: { samples: number[] }) {
  const y = (value: number) => 57 - value / 4 * 48
  return <svg className="sparkline" viewBox="0 0 210 65" role="img" aria-label="ضغط الشبكة خلال فترة المحاكاة"><path d="M0 13 H210 M0 36 H210 M0 59 H210" stroke="currentColor" strokeOpacity="0.08" fill="none" /><polyline points={samples.map((value, i) => `${i / Math.max(samples.length - 1, 1) * 210},${y(value)}`).join(' ')} stroke="#247ce5" strokeWidth="2" strokeLinejoin="round" fill="none" /><circle cx={samples.length > 1 ? 210 : 0} cy={y(samples[samples.length - 1])} r="3" fill="#247ce5" /></svg>
}

export default function Simulation({ state, dispatch }: { state: SimulationState; dispatch: Dispatch<SimulationAction> }) {
  const [cutaway, setCutaway] = useState(false)
  const [showReadouts, setShowReadouts] = useState(true)
  const [cameraRequest, setCameraRequest] = useState<{ sequence: number; mode: Camera }>({ sequence: 0, mode: 'perspective' })
  const [panel, setPanel] = useState<Panel>(null)
  const [samples, setSamples] = useState([getReadings(state).pressureBar])
  const mapRegion = useRef<HTMLElement>(null)
  const reportButton = useRef<HTMLButtonElement>(null)
  const latest = useRef(state)
  useEffect(() => { latest.current = state }, [state])
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    let previous = performance.now()
    const interval = window.setInterval(() => {
      const now = performance.now(), dt = (now - previous) / 1000
      previous = now
      if (!document.hidden) dispatch({ type: 'tick', dt })
    }, 100)
    const sampleInterval = window.setInterval(() => {
      if (!latest.current.paused && !document.hidden) setSamples(values => [...values.slice(-59), getReadings(latest.current).pressureBar])
    }, 500)
    return () => { clearInterval(interval); clearInterval(sampleInterval); document.body.style.overflow = previousOverflow }
  }, [dispatch])
  const readings = getReadings(state)
  const phaseIndex = phases.findIndex(item => item.key === state.phase)
  const selected = ZONES.find(zone => zone.id === state.selectedZone)!
  const incident = state.leakZone !== null
  const detected = state.phase === 'detected', isolated = state.phase === 'isolated'
  function camera(mode: Camera) { setCameraRequest(value => ({ sequence: value.sequence + 1, mode })) }
  function visitLeak() {
    if (state.leakZone === 'B') setCutaway(true)
    camera('focus')
    mapRegion.current?.querySelector<HTMLElement>('.farm-viewport')?.focus({ preventScroll: true })
  }
  function act() {
    if (!incident) {
      dispatch({ type: 'trigger-leak' })
      if (selected.kind === 'buried') setCutaway(true)
      setPanel(null)
    } else if (detected) { dispatch({ type: 'isolate' }); setPanel(null) }
    else if (isolated) { dispatch({ type: 'repair' }); setPanel('report') }
  }
  function reset() { dispatch({ type: 'reset' }); setSamples([3.2]); setPanel(null); camera('perspective') }
  function closeReport() { setPanel(null); requestAnimationFrame(() => reportButton.current?.focus({ preventScroll: true })) }
  const actionDisabled = !incident ? !state.pumpOn || state.paused : !detected && !isolated
  const actionLabel = !incident ? 'إحداث تسريب' : detected ? 'عزل الفرع وإيقاف الهدر' : isolated ? 'إصلاح الفرع وإعادة الري' : 'جارٍ تحليل التسريب'
  const actionButton = <button className={`lab-primary-action ${detected ? 'is-danger' : isolated ? 'is-success' : ''}`} disabled={actionDisabled} onClick={act}>{isolated ? <Wrench size={19} /> : detected ? <ShieldCheck size={19} /> : incident ? <ScanLine size={19} /> : <Droplets size={19} />}<span>{actionLabel}<small>{!state.pumpOn && !isolated ? 'شغّل المضخة من التجربة' : state.paused && !incident ? 'استأنف المحاكاة أولًا' : `القطاع ${state.selectedZone} · ${selected.kind === 'buried' ? 'ري مدفون' : 'ري ظاهر'}`}</small></span></button>

  return <main id="main" tabIndex={-1} className="immersive-lab">
    <h1 className="lab-sr-only">مزرعة مسار الافتراضية</h1>
    <section ref={mapRegion} tabIndex={-1} className="lab-map" aria-label="خريطة محاكاة المزرعة">
      <Suspense fallback={<div className="scene-loading">تحميل المزرعة</div>}><FarmViewer state={state} cutaway={cutaway} showReadouts={showReadouts} cameraRequest={cameraRequest} onZone={zone => dispatch({ type: 'select-zone', zone })} /></Suspense>
    </section>
    <header className="lab-overlay-header"><Link to="/" className="lab-brand" aria-label="مسار — الرئيسية"><img src="/brand/masar-navy.png" alt="مسار" width="90" height="40" /><span>المزرعة الافتراضية<small>محاكاة توضيحية</small></span></Link><Link to="/" className="lab-exit" aria-label="العودة للرئيسية" title="العودة للرئيسية"><ArrowUpLeft size={20} /></Link></header>
    {incident ? <div className={`leak-alarm ${isolated ? 'contained' : ''}`} role="alert"><button onClick={visitLeak} aria-label={detected || isolated ? `الانتقال إلى التسريب في القطاع ${state.detectedZone}` : 'الانتقال لمتابعة تحليل التسريب'}><span className="alarm-icon">{isolated ? <ShieldCheck size={21} /> : <BellRing size={21} />}</span><span className="alarm-copy"><strong>{isolated ? `القطاع ${state.detectedZone} معزول · بانتظار الإصلاح` : detected ? `إنذار تسريب · القطاع ${state.detectedZone}` : 'رُصد اختلاف في تدفق الماء'}</strong><span>{detected || isolated ? 'اضغط للوصول إلى الفرع المتضرر' : 'جارٍ مقارنة قراءات الحساسات'}</span></span><span className="alarm-action"><LocateFixed size={18} /><span>الموقع</span></span></button></div> : <div className="lab-network-status" role="status"><span className="status-dot" />{state.paused ? 'المحاكاة متوقفة مؤقتًا' : state.pumpOn ? 'الشبكة تعمل بانسيابية' : 'المضخة متوقفة'}</div>}

    <nav className="lab-dock" aria-label="أدوات المحاكاة"><div className="lab-dock-main"><div className="lab-session"><button className="lab-pause" aria-label={state.paused ? 'استئناف المحاكاة' : 'إيقاف المحاكاة مؤقتًا'} onClick={() => dispatch({ type: 'toggle-pause' })}>{state.paused ? <Play size={20} /> : <Pause size={20} />}</button><span className="mono">{format(state.elapsedSeconds, 0)}<small> s</small></span></div>{actionButton}</div><div className="lab-dock-tools">
      <button aria-label="إعدادات التجربة" aria-haspopup="dialog" onClick={() => setPanel('experiment')}><SlidersHorizontal size={20} /><span>التجربة</span></button>
      <button aria-label="قراءات الشبكة ومراحل الاكتشاف" aria-haspopup="dialog" onClick={() => setPanel('telemetry')}><Activity size={20} /><span>القراءات</span></button>
      <button aria-label="إعدادات عرض الخريطة" aria-haspopup="dialog" onClick={() => setPanel('view')}><Layers3 size={20} /><span>العرض</span></button>
      <button ref={reportButton} aria-label="تقرير آخر إصلاح" aria-haspopup="dialog" onClick={() => setPanel('report')}><FileText size={20} /><span>التقرير</span>{state.lastReport && <i className="lab-report-dot" />}</button>
    </div></nav>

    {panel === 'report' && state.lastReport ? <IncidentReportDialog report={state.lastReport} onClose={closeReport} /> : panel && <SimulationPanel title={panel === 'experiment' ? 'تحكّم بالتجربة' : panel === 'telemetry' ? 'نبض الشبكة' : panel === 'view' ? 'العرض والطبقات' : 'تقرير الإصلاح'} onClose={() => setPanel(null)}>
      {panel === 'experiment' && <>
        <fieldset className="lab-zone-picker" disabled={incident}><legend>اختر القطاع الذي تريد اختباره</legend>{ZONES.map(zone => <button key={zone.id} aria-pressed={state.selectedZone === zone.id} onClick={() => dispatch({ type: 'select-zone', zone: zone.id })}><b className="mono">{zone.id}</b><span>{zone.id === 'A' ? 'حقل الخضروات' : zone.id === 'B' ? 'الري المدفون' : 'البستان'}<small>{zone.kind === 'buried' ? 'تحت سطح التربة' : 'شبكة ري ظاهرة'}</small></span>{state.selectedZone === zone.id && <Check size={16} />}</button>)}</fieldset>
        <div className="lab-severity"><label htmlFor="severity">شدّة التسريب <b className="mono">{state.severity}%</b></label><input id="severity" type="range" min="10" max="100" step="5" value={state.severity} disabled={isolated} onChange={event => dispatch({ type: 'set-severity', severity: Number(event.target.value) })} /><div><span>تسريب خفيف</span><span>تسريب كبير</span></div></div>
        <div className="lab-setting-row"><span><Waves size={18} /> مضخة المياه</span><button role="switch" aria-label="تشغيل مضخة المياه" aria-checked={state.pumpOn} className={`switch ${state.pumpOn ? 'on' : ''}`} onClick={() => dispatch({ type: 'toggle-pump' })}><span /></button></div>
        <label className="lab-setting-row" htmlFor="lab-speed"><span>سرعة المحاكاة</span><select id="lab-speed" value={state.speed} onChange={event => dispatch({ type: 'set-speed', speed: Number(event.target.value) as 1 | 2 })}><option value="1">1×</option><option value="2">2×</option></select></label>
        <div className="lab-panel-actions">{actionButton}<button className="lab-reset" onClick={reset}><RotateCcw size={17} /> إعادة التجربة</button></div>
        <details className="lab-help"><summary><CircleHelp size={16} /> كيف أجرّب المحاكاة؟</summary><p>اختر القطاع وأحدث تسريبًا ثم اضغط الإنذار للوصول إليه وبعد تحديد الفرع اعزله وأصلحه لعرض تقرير الخسائر والتوفير</p><p>إعادة التجربة تمسح العدادات وآخر تقرير</p></details>
      </>}
      {panel === 'telemetry' && <>
        <div className="lab-pressure"><span><Gauge size={18} /> ضغط الشبكة</span><strong className="mono">{format(readings.pressureBar, 2)} <small>بار</small></strong><Sparkline samples={samples} /><span className="lab-chart-label">آخر القراءات <span>الآن</span></span></div>
        <dl className="lab-metrics"><div><dt>تدفق الدخول</dt><dd>{format(readings.totalFlowLpm)} <small>لتر/دقيقة</small></dd></div><div><dt>الماء المفقود</dt><dd>{format(state.waterLostLiters, 2)} <small>لتر</small></dd></div><div><dt>الماء الواصل إلى الري</dt><dd>{format(readings.efficiencyPercent, 0)}%</dd></div></dl>
        <div className="lab-sensor-heading"><h3>حساسات القطاعات</h3><span>دخول / خروج · لتر/دقيقة</span></div><div className="lab-sensor-rows">{readings.zones.map(zone => <div key={zone.zoneId}><b className="mono">{zone.zoneId}</b><span className="mono">{format(zone.upstreamFlowLpm)} / {format(zone.downstreamFlowLpm)}</span><span className={zone.isolated ? 'is-isolated' : zone.leakFlowLpm > 0 ? 'is-warning' : ''}>{zone.isolated ? 'معزول' : zone.leakFlowLpm > 0 ? 'فرق في التدفق' : 'متوازن'}</span></div>)}</div>
        <ol className="lab-stages" aria-label="مراحل اكتشاف التسريب">{phases.map((phase, index) => <li key={phase.key} className={index === phaseIndex ? 'current' : index < phaseIndex ? 'complete' : ''} aria-current={index === phaseIndex ? 'step' : undefined}><phase.icon size={16} />{phase.title}</li>)}</ol><p className="lab-disclaimer">قراءات محاكاة توضيحية · تحديد الفرع المتضرر بين الحساسات</p>
      </>}
      {panel === 'view' && <>
        <h3 className="lab-option-title">طبقات المزرعة</h3><div className="lab-view-options"><button aria-pressed={!cutaway} onClick={() => setCutaway(false)}><Layers3 size={21} /><span>فوق الأرض<small>المزرعة وشبكة الري الظاهرة</small></span></button><button aria-pressed={cutaway} onClick={() => setCutaway(true)}><ScanLine size={21} /><span>كشف الأنابيب<small>مقطع أرضي للخط المدفون</small></span></button></div>
        <div className="lab-setting-row"><span><Radio size={18} /> القراءات فوق الحساسات</span><button role="switch" aria-label="إظهار قراءات الحساسات على الخريطة" aria-checked={showReadouts} className={`switch ${showReadouts ? 'on' : ''}`} onClick={() => setShowReadouts(value => !value)}><span /></button></div>
        <h3 className="lab-option-title">زاوية المشاهدة</h3><div className="lab-camera-options"><button onClick={() => { camera('perspective'); setPanel(null) }}><Focus size={22} /> منظور حر</button><button onClick={() => { camera('top'); setPanel(null) }}><Map size={22} /> من الأعلى</button><button onClick={() => { camera('focus'); setPanel(null) }}><LocateFixed size={22} /> تتبّع القطاع</button></div>
        <p className="lab-disclaimer">اسحب لتدوير المشهد · كبّر بإصبعين أو بالأزرار الجانبية<br />لوحة المفاتيح: الأسهم للتدوير و + − للتقريب</p><Link to="/device" className="lab-device-link"><Cpu size={19} /> استكشف جهاز مسار من الداخل <ArrowLeft size={17} /></Link>
      </>}
      {panel === 'report' && <div className="lab-empty-report"><FileText size={40} strokeWidth={1.3} /><h3>يظهر التقرير بعد إصلاح التسريب</h3><p>ابدأ التجربة ثم اعزل الفرع المتضرر وأصلحه لتشاهد الماء المفقود وتقدير التوفير</p><button className="button primary" onClick={() => setPanel('experiment')}>إعداد التجربة</button></div>}
    </SimulationPanel>}
  </main>
}
