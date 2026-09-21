import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RotateCcw, Rotate3D, ZoomIn, ZoomOut, LoaderCircle } from 'lucide-react'
import { createStage, disposeObject, type Stage } from '../lib/three-stage'

type Props = { exploded?: boolean; activePart?: string; isolated?: boolean; hero?: boolean }
type Part = { object: THREE.Object3D; origin: THREE.Vector3; offset: THREE.Vector3; rotation: number[]; assembled: THREE.Box3; exploded: THREE.Box3 }
const readBox = (value: { min: number[]; max: number[] }) => new THREE.Box3(new THREE.Vector3().fromArray(value.min), new THREE.Vector3().fromArray(value.max))

export default function DeviceViewer({ exploded = false, activePart, isolated = false, hero = false }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<Stage | null>(null)
  const resetView = useRef(() => {})
  const options = useRef({ exploded, activePart, isolated })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => { options.current = { exploded, activePart, isolated } }, [exploded, activePart, isolated])
  useEffect(() => {
    if (!host.current) return
    let current: Stage
    try { current = createStage(host.current) } catch { setStatus('error'); return }
    stage.current = current
    let model: THREE.Group | null = null
    let explosion = 0
    let mode = ''
    let aspect = 0
    let fitPending = true
    let targetDistance = 12
    let marked: string | undefined
    const parts: Part[] = []
    const assembledBox = new THREE.Box3()
    const explodedBox = new THREE.Box3()
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    const offset = new THREE.Vector3()
    const highlights = new Map<string, THREE.Mesh[]>()
    resetView.current = () => { mode = ''; fitPending = true }
    new GLTFLoader().load('/models/masar-device.glb?v=3', gltf => {
      if (current.disposed) { disposeObject(gltf.scene); return }
      model = gltf.scene
      model.traverse(child => {
        if (child.userData.layoutVersion === 2 && child.userData.assembledBounds) {
          const part = { object: child, origin: new THREE.Vector3().fromArray(child.userData.assembledOrigin), offset: new THREE.Vector3().fromArray(child.userData.explode), rotation: child.userData.explodeRotation as number[], assembled: readBox(child.userData.assembledBounds), exploded: readBox(child.userData.explodedBounds) }
          parts.push(part)
          assembledBox.union(part.assembled)
          explodedBox.union(part.exploded)
        }
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      const orangeLayer = new THREE.MeshBasicMaterial({ color: 0xff8700, transparent: true, opacity: 0.58, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, toneMapped: false, side: THREE.DoubleSide })
      for (const part of parts) {
        const meshes: THREE.Mesh[] = []
        part.object.traverse(child => { if (child instanceof THREE.Mesh) meshes.push(child) })
        highlights.set(part.object.name, meshes.map(mesh => {
          const layer = new THREE.Mesh(mesh.geometry, orangeLayer)
          layer.name = `${part.object.name}-selection-overlay`
          layer.visible = false
          layer.renderOrder = 1
          mesh.add(layer)
          return layer
        }))
      }
      current.scene.add(model)
      setStatus('ready')
    }, undefined, () => { if (!current.disposed) setStatus('error') })
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    current.setUpdate((_time, delta) => {
      if (!model || !parts.length) return
      const view = options.current
      const solo = view.isolated ? parts.find(part => part.object.name === view.activePart) : undefined
      const goal = view.exploded && !solo ? 1 : 0
      explosion = reduced.matches ? goal : THREE.MathUtils.damp(explosion, goal, 6, delta)
      for (const part of parts) {
        part.object.visible = !solo || part === solo
        // GLB roots are centred on their own geometry, not the body origin
        part.object.position.copy(part.origin).addScaledVector(part.offset, explosion)
        part.object.rotation.set(part.rotation[0] * explosion, part.rotation[1] * explosion, part.rotation[2] * explosion)
      }
      const a = solo?.assembled ?? assembledBox
      const b = solo?.exploded ?? explodedBox
      a.getCenter(center).lerp(b.getCenter(offset), explosion)
      model.position.copy(center).negate()
      current.ground.position.y = THREE.MathUtils.lerp(a.min.y, b.min.y, explosion) - center.y - 0.2
      current.ground.visible = !solo
      const nextMode = `${goal}:${solo?.object.name ?? 'all'}`
      if (mode !== nextMode || aspect !== current.camera.aspect) {
        mode = nextMode
        aspect = current.camera.aspect
        const box = solo?.assembled ?? (goal ? explodedBox : assembledBox)
        box.getSize(size)
        const tangent = Math.tan(THREE.MathUtils.degToRad(current.camera.fov) / 2)
        targetDistance = Math.max(size.y / tangent, size.x / (tangent * aspect)) * 0.66 + size.z
        targetDistance = THREE.MathUtils.clamp(targetDistance, 3.2, 40)
        current.camera.position.set(goal ? 0.10 : 0.27, goal ? 0.52 : 0.18, 1).normalize().multiplyScalar(current.camera.position.length())
        current.controls.target.set(0, 0, 0)
        fitPending = true
      }
      if (fitPending) {
        const distance = reduced.matches ? targetDistance : THREE.MathUtils.damp(current.camera.position.length(), targetDistance, 6, delta)
        current.camera.position.normalize().multiplyScalar(distance)
        if (Math.abs(distance - targetDistance) < 0.015) fitPending = false
      }
      if (marked !== view.activePart) {
        marked = view.activePart
        for (const [name, layers] of highlights) for (const layer of layers) layer.visible = name === marked
      }
    })
    return () => { current.dispose(); stage.current = null; resetView.current = () => {} }
  }, [])
  return <div className={`device-viewport ${hero ? 'hero-viewport' : ''}`} tabIndex={0} role="region" aria-label="جهاز مسار ثلاثي الأبعاد — اسحب أو استخدم الأسهم للتدوير ومفتاحي زائد وناقص للتقريب">
    <div className="canvas-host" ref={host} />
    {status === 'loading' && <div className="scene-loading"><LoaderCircle className="spin" size={22} /><span>نجهّز لك المجسّم</span></div>}
    {status === 'error' && <div className="scene-fallback"><img src="/images/device-render.png" alt="مجسّم جهاز مسار المعدني" /><p>تعذّر تشغيل العرض ثلاثي الأبعاد على هذا المتصفح</p></div>}
    <div className="scene-bottom"><span><Rotate3D size={15} /> {isolated ? 'القطعة معزولة · اسحب لتفحّصها' : 'اسحب لاستكشاف الجهاز'}</span><div className="scene-actions">
      {!hero && <><button aria-label="تقريب الجهاز" onClick={() => stage.current?.zoom(0.85)}><ZoomIn size={17} /></button><button aria-label="إبعاد الجهاز" onClick={() => stage.current?.zoom(1.15)}><ZoomOut size={17} /></button></>}
      <button aria-label="إعادة زاوية الجهاز" onClick={() => resetView.current()}><RotateCcw size={17} /></button>
    </div></div>
  </div>
}
