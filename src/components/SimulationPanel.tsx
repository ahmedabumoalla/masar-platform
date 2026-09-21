import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function SimulationPanel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current!
    const previous = document.activeElement as HTMLElement | null
    element.showModal()
    return () => { element.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  return <dialog ref={dialog} className="simulation-panel" aria-labelledby="simulation-panel-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="simulation-panel-heading"><div><span className="eyebrow">مختبر مسار</span><h2 id="simulation-panel-title">{title}</h2></div><button autoFocus aria-label="إغلاق النافذة والعودة للخريطة" onClick={onClose}><X size={21} /></button></header>
    <div className="simulation-panel-content">{children}</div>
  </dialog>
}
