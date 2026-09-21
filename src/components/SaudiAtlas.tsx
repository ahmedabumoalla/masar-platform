import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { ArrowUpLeft, LocateFixed, Minus, Plus, Search, X } from 'lucide-react'
import AtlasPlaceDialog from './AtlasPlaceDialog'
import { atlas, boundedCamera, filterPlaces, HOME_CAMERA, mapView, nextDirectionalPlace, profileFor, regionCamera } from '../lib/saudi-atlas'
import type { AtlasPlace, Camera } from '../lib/saudi-atlas'
import './saudi-atlas.css'

const waterLabels = { ground: 'مياه جوفية وآبار', rain: 'أمطار وحصاد مياه', mixed: 'مصادر متنوعة' }
const defaultPlace = atlas.places.find(place => place.key === 'Al Ahsa Governorate')!

export default function SaudiAtlas() {
  const [region, setRegion] = useState('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(defaultPlace.id)
  const [camera, setCamera] = useState<Camera>(HOME_CAMERA)
  const [size, setSize] = useState({ width: 800, height: 640 })
  const [dragging, setDragging] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const markers = useRef(new Map<string, SVGGElement>())
  const drag = useRef<{ id: number; x: number; y: number; camera: Camera; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const visible = filterPlaces(region, query)
  const active = atlas.places.find(place => place.id === activeId) ?? defaultPlace
  const view = mapView(size.width, size.height, camera)
  const availableFocus = visible.some(place => place.id === activeId) ? activeId : visible[0]?.id

  useEffect(() => {
    const element = host.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  function choose(place: AtlasPlace, openDetails = true, focusMap = false) {
    setActiveId(place.id)
    setCamera({ x: place.point[0], y: place.point[1], zoom: Math.max(3, camera.zoom) })
    if (focusMap) markers.current.get(place.id)?.focus({ preventScroll: true })
    if (openDetails) setDetailsOpen(true)
  }

  function chooseRegion(id: string) {
    setRegion(id)
    setQuery('')
    setCamera(regionCamera(id))
    if (id !== 'all') {
      const candidates = filterPlaces(id, '')
      setActiveId((candidates.find(place => profileFor(place).scope === 'local') ?? candidates[0]).id)
    }
  }

  function zoom(multiplier: number) {
    setCamera(previous => boundedCamera({ ...previous, zoom: previous.zoom * multiplier }))
  }

  function startDrag(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || drag.current) return
    suppressClick.current = false
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, camera, moved: false }
    // Capture only empty-map gestures. Capturing a marker would retarget its click.
    if (!(event.target as Element).closest('[data-place]')) event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const gesture = drag.current
    if (!gesture || gesture.id !== event.pointerId) return
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y
    if (Math.hypot(dx, dy) < 6 && !gesture.moved) return
    gesture.moved = true
    suppressClick.current = true
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    setCamera(boundedCamera({ ...gesture.camera, x: gesture.camera.x - dx / view.scale, y: gesture.camera.y - dy / view.scale }))
  }

  function endDrag() {
    drag.current = null
    setDragging(false)
  }

  function markerKey(event: KeyboardEvent<SVGGElement>, place: AtlasPlace) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(place)
    } else if (event.key.startsWith('Arrow')) {
      event.preventDefault()
      event.stopPropagation()
      const next = nextDirectionalPlace(place, visible, event.key)
      if (next) choose(next, false, true)
    }
  }

  return <section className="saudi-atlas" id="saudi-atlas" aria-labelledby="atlas-heading">
    <div className="atlas-heading-row">
      <div><div className="eyebrow"><span className="short-line" /> أطلس مسار الزراعي</div><h2 id="atlas-heading">لكل أرض <span>حكاية مع الماء</span></h2><p>اكتشف مصادر الري والمحاصيل البارزة في مناطق المملكة ومحافظاتها</p></div>
      <div className="atlas-coverage"><strong className="mono">13</strong><span>منطقة سعودية<br /><small>من الواحات إلى المدرجات</small></span></div>
    </div>
    <div className="atlas-workspace">
        <div className="atlas-filters" role="group" aria-label="البحث واختيار موقع على الخريطة">
          <label htmlFor="atlas-region">استكشف منطقتك</label>
          <select id="atlas-region" value={region} onChange={event => chooseRegion(event.target.value)}><option value="all">كل مناطق المملكة</option>{atlas.regions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <div className="atlas-search"><Search size={17} aria-hidden="true" /><input id="atlas-search" aria-label="ابحث عن محافظة أو مدينة" placeholder="ابحث عن محافظة أو مدينة" value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="مسح البحث" onClick={() => setQuery('')}><X size={16} /></button>}</div>
          <label className="atlas-place-select">المحافظة أو مقر المنطقة<select value={visible.some(place => place.id === activeId) ? activeId : ''} onChange={event => { const place = visible.find(item => item.id === event.target.value); if (place) choose(place) }}><option value="" disabled>اختر موقعًا</option>{visible.map(place => <option key={place.id} value={place.id}>{place.name}{place.capital ? ' · مقر المنطقة' : ''}</option>)}</select></label>
          {query && <div className="atlas-results"><p role="status">{visible.length ? `${visible.length} نتيجة` : 'لا توجد نتائج، جرّب اسمًا آخر أو اختر كل المناطق'}</p>{visible.map(place => <button key={place.id} aria-pressed={activeId === place.id} aria-haspopup="dialog" onClick={event => { event.currentTarget.focus({ preventScroll: true }); choose(place) }}><span>{place.name}</span><small>{atlas.regions.find(item => item.id === place.region)!.name}</small><ArrowUpLeft size={15} aria-hidden="true" /></button>)}</div>}
        </div>
      <div className="atlas-map-column">
        <div className="atlas-map-topline"><span><span className="status-dot" /> اضغط على دائرة لاستكشاف الموقع</span><span className="mono">SAUDI ARABIA / WATER & LAND</span></div>
        <div ref={host} className={`atlas-map ${dragging ? 'is-dragging' : ''} ${camera.zoom > 1 ? 'is-zoomed' : ''}`}>
          <svg className="atlas-svg" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} aria-label="خريطة تفاعلية لمحافظات المملكة العربية السعودية" aria-describedby="atlas-map-help" role="group" tabIndex={0}
            onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
            onKeyDown={event => { if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.5) } else if (event.key === '-') { event.preventDefault(); zoom(1 / 1.5) } else if (event.key === 'Home') { event.preventDefault(); setCamera(HOME_CAMERA) } }}>
            <title>مناطق المملكة ومحافظاتها</title>
            <g className="atlas-land" aria-hidden="true"><path d={atlas.landPath} fillRule="evenodd" vectorEffect="non-scaling-stroke" />{atlas.regions.map(item => <path key={item.id} d={item.path} className={region === item.id || (region === 'all' && active.region === item.id) ? 'selected-region' : ''} fillRule="evenodd" vectorEffect="non-scaling-stroke" />)}</g>
            <g className="atlas-sea-labels" aria-hidden="true"><text x="152" y="370" transform="rotate(50 152 370)">البحر الأحمر</text><text x="685" y="210" transform="rotate(35 685 210)">الخليج العربي</text><text x="560" y="515">الربع الخالي</text></g>
            {[...visible.filter(place => place.id !== activeId), ...visible.filter(place => place.id === activeId)].map(place => {
              const selected = activeId === place.id
              const data = profileFor(place)
              const [x, y] = place.point
              const r = (selected ? 8 : data.scope === 'local' ? 5 : 3.5) / view.scale
              return <g key={place.id} ref={node => { if (node) markers.current.set(place.id, node); else markers.current.delete(place.id) }} data-place={place.id} transform={`translate(${x} ${y})`} role="button" tabIndex={availableFocus === place.id ? 0 : -1} aria-label={`${place.name}، ${data.scope === 'local' ? 'ملف محلي' : 'معلومات إقليمية'}`} aria-haspopup="dialog" aria-pressed={selected} className={`atlas-marker ${data.waterKind} ${selected ? 'is-selected' : ''} ${data.scope}`} onClick={event => { if (!suppressClick.current) { event.currentTarget.focus({ preventScroll: true }); choose(place) } }} onKeyDown={event => markerKey(event, place)}>
                <title>{place.name} — {data.scope === 'local' ? data.waterTitle : `معلومات منطقة ${atlas.regions.find(item => item.id === place.region)!.name}`}</title>
                <circle className="atlas-marker-hit" r={14 / view.scale} />
                {selected && <circle className="atlas-marker-ring" r={16 / view.scale} vectorEffect="non-scaling-stroke" />}
                <circle className="atlas-marker-dot" r={r} vectorEffect="non-scaling-stroke" />
                {selected && <g className="atlas-marker-label" transform={`scale(${1 / view.scale})`} aria-hidden="true"><rect x={-Math.max(38, place.name.length * 4 + 12)} y="-49" width={Math.max(76, place.name.length * 8 + 24)} height="26" rx="5" /><text textAnchor="middle" y="-31">{place.name}</text></g>}
              </g>
            })}
          </svg>
          <span className="atlas-north" aria-hidden="true"><span>↑</span><small>N</small></span>
          <div className="atlas-map-tools" aria-label="التحكم بالخريطة"><button aria-label="تكبير الخريطة" disabled={camera.zoom >= 7} onClick={() => zoom(1.5)}><Plus size={19} /></button><button aria-label="تصغير الخريطة" disabled={camera.zoom <= 1} onClick={() => zoom(1 / 1.5)}><Minus size={19} /></button><button aria-label="عرض المملكة كاملة" onClick={() => { setRegion('all'); setQuery(''); setCamera(HOME_CAMERA) }}><LocateFixed size={19} /></button></div>
          <div className="atlas-map-caption"><strong>{region === 'all' ? 'المملكة العربية السعودية' : atlas.regions.find(item => item.id === region)!.name}</strong><span>{visible.length} موقعًا على الخريطة</span></div>
        </div>
        <div className="atlas-legend" aria-label="مفتاح الخريطة">{Object.entries(waterLabels).map(([key, label]) => <span key={key}><i className={key} />{label}</span>)}</div>
        <p className="atlas-help" id="atlas-map-help">كبّر ثم اسحب لاستكشاف الدوائر المتقاربة، أو اختر الاسم من القائمة · الأسهم للتنقل بين النقاط وEnter للاختيار</p>
        <p className="atlas-data-note">الألوان تصف مصادر المياه في الملف وليست نسبًا أو قياسات حية · الآبار وسيلة لاستخراج المياه الجوفية · الدائرة الممتلئة لملف محلي والمفرغة لمعلومات المنطقة</p>
        <details className="atlas-method"><summary>عن البيانات وحدود الخريطة</summary><p>محاصيل بارزة موثقة وليست ترتيبًا إحصائيًا للأكثر إنتاجًا، ومصادر الري تختلف بين المزارع والمواسم داخل المحافظة الواحدة</p><p>النقاط مواقع تمثيلية للمحافظات ومقار المناطق وليست مواقع مزارع أو آبار فعلية، والمواقع المضافة للدمام والبيضاء والمويه والأمواه وأبانات تقريبية</p><p>حدود المناطق ونقاط المحافظات من بيانات 2021 وخلفية المملكة من 2017 مع استكمال الأسماء المذكورة، وليست خريطة مساحية أو سجلًا إداريًا حيًا · مراجعة المحتوى 21 سبتمبر 2026</p><p><a href="/data/saudi-atlas-licenses.txt" target="_blank" rel="noreferrer">مصادر الجغرافيا والتراخيص</a> · <a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p></details>
      </div>
    </div>
    {detailsOpen && <AtlasPlaceDialog place={active} onClose={() => setDetailsOpen(false)} />}
  </section>
}
