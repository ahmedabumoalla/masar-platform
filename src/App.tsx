import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Activity, ArrowDown, ArrowLeft, ArrowUpLeft, ChevronLeft, Cpu, Gauge, Layers3, Radio, ScanLine, ShieldCheck, Waves, Wifi, Wrench, Zap } from 'lucide-react'
import { createInitialState, simulationReducer } from './lib/simulation'
import Simulation from './components/Simulation'

const DeviceViewer = lazy(() => import('./components/DeviceViewer'))
const SaudiAtlas = lazy(() => import('./components/SaudiAtlas'))

function Header() {
  const { pathname } = useLocation()
  const lab = pathname === '/simulation'
  return <header className={`header ${lab ? 'lab-header' : ''}`}>
    <Link to="/" className="brand" aria-label="مسار — الرئيسية"><img src="/brand/masar-navy.png" alt="مسار" width="104" height="46" /></Link>
    {lab ? <div className="lab-title"><span className="status-dot" /> مختبر مسار <span className="mono">DIGITAL TWIN / 01</span></div> : <nav aria-label="التنقل الرئيسي"><NavLink to="/" end>الرئيسية</NavLink><NavLink to="/device">داخل الجهاز</NavLink><NavLink to="/simulation">المحاكاة الحية</NavLink></nav>}
    {lab ? <Link to="/" className="back-link">العودة للرئيسية <ArrowUpLeft size={17} /></Link> : <Link to="/simulation" className="button primary header-cta">جرّب مسار <ArrowUpLeft size={17} /></Link>}
  </header>
}

function Home() {
  return <>
    <main id="main" tabIndex={-1} className="home-main">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <div className="eyebrow"><span className="short-line" /> ذكاء يسري مع الماء</div>
          <h1 id="hero-heading">لكل قطرة ماء<br /><span>مســار</span><span className="title-period" /></h1>
          <p className="hero-description">رحلة الماء تستحق أن تُرى<br />جهاز ذكي يراقب تدفّقها ويكشف الخلل<br className="desktop-break" /> لتصل كل قطرة إلى مكانها</p>
          <div className="hero-ctas"><Link to="/simulation" className="button primary">عِش تجربة مسار <ArrowUpLeft size={20} /></Link><Link to="/device" className="text-link">اكتشف الجهاز <ChevronLeft size={17} /></Link></div>
          <div className="hero-footnote"><span className="status-dot" /> من الاستشعار إلى القرار <span className="line-divider" /><span>تجربة تفاعلية ثلاثية الأبعاد</span></div>
        </div>
        <div className="hero-product">
          <div className="product-topline"><span>هندسة تعتني بالتفاصيل</span><span className="mono">MASAR / SMART FLOW</span></div>
          <div className="product-orbit orbit-one" /><div className="product-orbit orbit-two" />
          <span className="orbit-cross cross-one">+</span><span className="orbit-cross cross-two">+</span>
          <Suspense fallback={<div className="scene-loading">تحميل الجهاز</div>}><DeviceViewer hero /></Suspense>
          <Link to="/device" className="device-callout callout-sensor"><span className="callout-icon"><Activity size={16} /></span><span><strong>يقرأ تدفّق الماء</strong><small className="mono">FLOW SENSING</small></span><span className="callout-line" /></Link>
          <Link to="/device" className="device-callout callout-connect"><span className="callout-icon"><Wifi size={16} /></span><span><strong>ينقل لك الصورة</strong><small className="mono">CONNECTED INTELLIGENCE</small></span></Link>
          <div className="model-caption"><span className="tiny-square" /> مجسّم مبني على جهاز مسار</div>
        </div>
      </section>
      <Suspense fallback={<div className="atlas-loading">تحميل خريطة المملكة</div>}><SaudiAtlas /></Suspense>
      <section className="journey" aria-label="كيف يعمل مسار">
        <div className="journey-intro"><span className="eyebrow">الماء يتحرّك</span><h2>ومسار يفهم رحلته</h2><Link to="/simulation" aria-label="اكتشف رحلة الماء في المحاكاة"><ArrowLeft size={24} /></Link></div>
        {[{ no: '01', icon: Waves, title: 'يستشعر', desc: 'يراقب التدفق والضغط داخل شبكة الري' }, { no: '02', icon: ScanLine, title: 'يكتشف', desc: 'يقارن القراءات ويحدّد الفرع المتأثر' }, { no: '03', icon: ShieldCheck, title: 'يحافظ', desc: 'ينبّهك لتتدخل وتوقف هدر الماء' }].map(item => <div className="journey-step" key={item.no}><div><item.icon size={23} strokeWidth={1.5} /><span className="mono">{item.no}</span></div><h3>{item.title}</h3><p>{item.desc}</p></div>)}
      </section>
      <section className="experience-link"><span><span className="status-dot" /> شاهد ما يحدث فوق الأرض وتحتها</span><Link to="/simulation">ادخل المزرعة الافتراضية <ArrowDown size={16} /></Link><span className="mono">DESIGNED AROUND EVERY DROP</span></section>
    </main>
    <footer className="home-footer"><span>مسار <span className="dot-separator">·</span> لكل قطرة ماء مسار</span><span>تجربة توضيحية للري الذكي</span></footer>
  </>
}

const parts = [
  { id: 'Display', number: '01', title: 'الواجهة وشاشة القراءة', tag: 'DISPLAY', text: 'واجهة دائرية زرقاء وشاشة رقمية داخل إطار معدني لعرض قراءة الجهاز مباشرة', icon: Gauge },
  { id: 'Seal', number: '02', title: 'حلقة الإحكام', tag: 'SEALING RING', text: 'حلقة بين الغطاء والجسم تساعد على إحكام التجميع حول المكوّنات الداخلية', icon: ShieldCheck },
  { id: 'PCB', number: '03', title: 'لوحة المعالجة', tag: 'CONTROL BOARD', text: 'لوحة إلكترونية دائرية تستقبل إشارات الاستشعار وتعالجها قبل عرضها وإرسالها', icon: Cpu },
  { id: 'Wireless', number: '04', title: 'وحدة الاتصال', tag: 'WIRELESS MODULE', text: 'وحدة إلكترونية صغيرة لربط قراءات الجهاز بالنظام ومتابعة حالة شبكة الري', icon: Radio },
  { id: 'Battery', number: '05', title: 'مصدر الطاقة', tag: 'POWER MODULE', text: 'بطارية داخلية موضّحة في التفكيك المرجعي لتغذية المكوّنات الإلكترونية', icon: Zap },
  { id: 'Sensor', number: '06', title: 'وحدة الاستشعار', tag: 'SENSOR ASSEMBLY', text: 'وحدة قياس داخل الجسم تنقل الإشارة من الجزء الميكانيكي إلى الدائرة الإلكترونية', icon: Activity },
  { id: 'Turbine', number: '07', title: 'توربين التدفق', tag: 'FLOW IMPELLER', text: 'مروحة داخل مسار الماء تدور مع مروره لتمثيل حركة التدفق في النموذج', icon: Waves },
  { id: 'Housing', number: '08', title: 'الجسم والوصلات', tag: 'INLINE HOUSING', text: 'جسم معدني ووصلتان ملولبتان يركّبان الجهاز ضمن خط الأنابيب مباشرة', icon: Wrench },
]

function Device() {
  const [exploded, setExploded] = useState(true)
  const [active, setActive] = useState('PCB')
  const [isolated, setIsolated] = useState(false)
  const selected = parts.find(p => p.id === active)!
  return <main id="main" tabIndex={-1} className="device-page">
    <div className="page-intro"><div><div className="eyebrow"><span className="short-line" /> التفاصيل تصنع الفارق</div><h1>من الداخل <span>تبدأ الحكاية</span></h1></div><p>استكشف طبقات الجهاز<br />من حركة الماء إلى قراءة واضحة</p></div>
    <div className="device-workspace">
      <aside className="parts-panel" aria-label="مكونات جهاز مسار"><div className="panel-label">مكوّنات الجهاز <span className="mono">08 PARTS</span></div>{parts.map(part => <button key={part.id} className={`part-button ${active === part.id ? 'active' : ''}`} aria-pressed={active === part.id} onClick={() => { setActive(part.id); setExploded(true) }}><span className="mono">{part.number}</span><part.icon size={18} /><span>{part.title}</span><ChevronLeft size={16} /></button>)}</aside>
      <section className="device-scene-panel"><div className="device-mode segmented"><button className={!exploded && !isolated ? 'active' : ''} aria-pressed={!exploded && !isolated} onClick={() => { setExploded(false); setIsolated(false) }}>الجهاز كاملًا</button><button className={exploded && !isolated ? 'active' : ''} aria-pressed={exploded && !isolated} onClick={() => { setExploded(true); setIsolated(false) }}><Layers3 size={16} /> استكشاف المكوّنات</button></div><Suspense fallback={<div className="scene-loading">تحميل المجسّم</div>}><DeviceViewer exploded={exploded} activePart={active} isolated={isolated} /></Suspense><span className="device-scene-index mono">MASAR · ENGINEERED TO SENSE</span></section>
      <aside className="part-detail" aria-live="polite"><span className="detail-number mono">{selected.number}<small> / 08</small></span><selected.icon size={30} strokeWidth={1.25} /><h2>{selected.title}</h2><span className="mono detail-tag">{selected.tag}</span><p>{selected.text}</p><button className="button secondary isolate-part" aria-pressed={isolated} onClick={() => setIsolated(value => !value)}><ScanLine size={17} />{isolated ? 'إظهار بقية المكوّنات' : 'عزل القطعة وتفحّصها'}</button><div className="part-detail-footer"><span className="status-dot" /> مستوحى من تفكيك الجهاز في ملف مسار</div><Link to="/simulation" className="button primary">شاهد الجهاز في المزرعة <ArrowUpLeft size={18} /></Link></aside>
    </div>
    <p className="model-note">إعادة بناء بصري للمكوّنات الظاهرة في المرجع وليست مخططات تصنيع أو أبعادًا هندسية معتمدة</p>
  </main>
}

function App() {
  const [state, dispatch] = useReducer(simulationReducer, undefined, createInitialState)
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    document.title = pathname === '/simulation' ? 'مختبر مسار — محاكاة الري الذكي' : pathname === '/device' ? 'داخل جهاز مسار — لكل قطرة ماء مسار' : 'مسار — لكل قطرة ماء مسار'
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0)
      document.getElementById('main')?.focus({ preventScroll: true })
      previousPath.current = pathname
    }
  }, [pathname])
  return <div className={`app ${pathname === '/simulation' ? 'lab-app' : ''}`}><a className="skip-link" href="#main">انتقل إلى المحتوى</a>{pathname !== '/simulation' && <Header />}<Routes><Route path="/" element={<Home />} /><Route path="/device" element={<Device />} /><Route path="/simulation" element={<Simulation state={state} dispatch={dispatch} />} /><Route path="*" element={<main id="main" tabIndex={-1} className="not-found"><h1>هذا المسار غير موجود</h1><Link className="button primary" to="/">العودة للرئيسية <ArrowLeft size={18} /></Link></main>} /></Routes></div>
}

export default App
