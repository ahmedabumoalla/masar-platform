import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpLeft, CloudRain, Droplets, ExternalLink, Leaf, X } from 'lucide-react'
import { atlas, profileFor, type AtlasPlace } from '../lib/saudi-atlas'

export default function AtlasPlaceDialog({ place, onClose }: { place: AtlasPlace; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const profile = profileFor(place)
  const regionName = atlas.regions.find(region => region.id === place.region)!.name
  const sources = [...new Map([...profile.waterSources, ...profile.cropSources].map(source => [source.url, source])).values()]

  useEffect(() => {
    const element = dialog.current!
    const previousFocus = document.activeElement as HTMLElement | SVGElement | null
    const previousOverflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return <dialog ref={dialog} className="atlas-dialog" aria-labelledby="atlas-dialog-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="atlas-dialog-heading">
      <div><div className="atlas-location"><span>{regionName}</span><span>{place.capital ? 'مقر المنطقة' : 'محافظة'}</span></div><h3 id="atlas-dialog-title">{place.name}</h3></div>
      <button type="button" autoFocus aria-label="إغلاق التفاصيل والعودة للخريطة" onClick={onClose}><X size={22} /></button>
    </header>
    <div className="atlas-dialog-content">
      <div className="atlas-detail">
        <p className={`atlas-scope ${profile.scope}`}>{profile.scope === 'local' ? 'ملف محلي موثّق' : `البيانات التالية لمنطقة ${regionName} عمومًا`}</p>
        <div className={`atlas-water ${profile.waterKind}`}><div>{profile.waterKind === 'rain' ? <CloudRain size={22} aria-hidden="true" /> : <Droplets size={22} aria-hidden="true" />}<span>مصادر مياه الري<strong>{profile.waterTitle}</strong></span></div><p>{profile.waterNote}</p></div>
        <div className="atlas-crops"><h4><Leaf size={17} aria-hidden="true" /> محاصيل ونباتات بارزة</h4><ul>{profile.crops.map(crop => <li key={crop}>{crop}</li>)}</ul><p>{profile.cropNote}</p></div>
        {profile.scope === 'region' && <p className="atlas-evidence-note">لا يتوفر في هذا الأطلس ترتيب محلي موثّق للمحاصيل أو مصادر المياه في {place.name}، لذلك لا ننسب بيانات المنطقة إلى المحافظة</p>}
      </div>
      <details className="atlas-sources"><summary>مصادر هذا الملف <ExternalLink size={13} aria-hidden="true" /></summary><ul>{sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={12} aria-hidden="true" /></a></li>)}</ul></details>
      <Link to="/simulation" className="atlas-simulation-link">شاهد كيف يحافظ مسار على الماء <ArrowUpLeft size={18} /></Link>
    </div>
  </dialog>
}
