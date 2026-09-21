import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Crosshair, Focus, LoaderCircle, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { createStage, disposeObject, type Stage } from '../lib/three-stage'
import { getReadings, ZONES, type SimulationState, type ZoneId } from '../lib/simulation'
import { createTrench, createValves, jetPoint, TRENCH_PLANES } from '../lib/farm-effects'

type Props = { state: SimulationState; cutaway: boolean; showReadouts?: boolean; cameraRequest?: { sequence: number; mode: CameraMode }; onZone: (zone: ZoneId) => void }
type CameraMode = 'perspective' | 'top' | 'focus'
const pairFor = (zone: ZoneId) => zone === 'A' ? [-6.8, -2] : [0, 7]

export default function FarmViewer({ state, cutaway, showReadouts = true, cameraRequest, onZone }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const meterPins = useRef<(HTMLDivElement | null)[]>([])
  const stage = useRef<Stage | null>(null)
  const cameraCommand = useRef<(mode: CameraMode) => void>(() => {})
  const options = useRef({ state, cutaway, showReadouts })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [cameraMode, setCameraMode] = useState<CameraMode>('perspective')
  useEffect(() => { options.current = { state, cutaway, showReadouts } }, [state, cutaway, showReadouts])
  useEffect(() => {
    if (!host.current) return
    let current: Stage
    try { current = createStage(host.current, true) } catch { setStatus('error'); return }
    stage.current = current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let farm: THREE.Group | null = null
    let shownCutaway: boolean | null = null
    let animationTime = 0
    let previousElapsed = 0
    const flowOffsets = [0, 0, 0]
    const soilMaterials: THREE.MeshStandardMaterial[] = []
    let buriedPipes: THREE.Object3D | undefined
    const deviceGroups: THREE.Group[] = []
    const signals: { mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; zoneIndex: number; side: number }[] = []
    const trench = createTrench()
    current.scene.add(trench)
    const valves = createValves()
    valves.forEach(valve => current.scene.add(valve.group))
    const loader = new GLTFLoader()
    Promise.allSettled([loader.loadAsync('/models/masar-farm.glb'), loader.loadAsync('/models/masar-device.glb?v=3')]).then(results => {
      if (current.disposed || results.some(result => result.status === 'rejected')) {
        for (const result of results) if (result.status === 'fulfilled') disposeObject(result.value.scene)
        if (!current.disposed) setStatus('error')
        return
      }
      const [farmGltf, deviceGltf] = results.map(result => (result as PromiseFulfilledResult<Awaited<ReturnType<typeof loader.loadAsync>>>).value)
      farm = farmGltf.scene
      farm.traverse(child => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true } })
      for (const name of ['Soil', 'TerrainSurface']) farm.getObjectByName(name)?.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return
        const materials = (Array.isArray(child.material) ? child.material : [child.material]).map(mat => mat.clone())
        child.material = Array.isArray(child.material) ? materials : materials[0]
        for (const material of materials) if (material instanceof THREE.MeshStandardMaterial) {
          material.clipIntersection = true
          material.clipShadows = true
          soilMaterials.push(material)
        }
      })
      buriedPipes = farm.getObjectByName('BuriedPipes')
      current.scene.add(farm)
      ZONES.forEach((zone, zoneIndex) => {
        const group = new THREE.Group()
        group.name = `Sensors-${zone.id}`
        pairFor(zone.id).forEach((x, side) => {
          const meter = deviceGltf.scene.clone(true)
          for (const part of ['Turbine', 'Sensor', 'Battery', 'Wireless', 'PCB', 'Seal']) {
            const internal = meter.getObjectByName(part)
            if (internal) internal.visible = false
          }
          meter.scale.setScalar(0.2)
          meter.position.set(x, zone.kind === 'buried' ? -1.05 : 0.4, zone.z)
          meter.rotation.x = -0.5
          group.add(meter)
          const signal = new THREE.Mesh(new THREE.RingGeometry(0.23, 0.26, 28), new THREE.MeshBasicMaterial({ color: 0x62d4fa, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }))
          signal.rotation.x = -Math.PI / 2
          signal.position.set(x, meter.position.y + 0.57, zone.z)
          group.add(signal)
          signals.push({ mesh: signal, zoneIndex, side })
        })
        group.userData.zone = zone.id
        current.scene.add(group)
        deviceGroups.push(group)
      })
      setStatus('ready')
      shownCutaway = null
    })

    // Camera travel uses wall time, independently of the simulation clock.
    let transition: { from: THREE.Vector3; to: THREE.Vector3; targetFrom: THREE.Vector3; targetTo: THREE.Vector3; progress: number } | null = null
    let following = false
    let focusedKey = ''
    cameraCommand.current = mode => {
      following = mode === 'focus'
      const { state: s, cutaway: cut } = options.current
      const zone = ZONES.find(item => item.id === (s.detectedZone ?? s.selectedZone))!
      const target = mode === 'focus' ? new THREE.Vector3(zone.id === 'A' ? -4.4 : 3.5, zone.kind === 'buried' && cut ? -0.65 : 0.5, zone.z) : new THREE.Vector3()
      const offset = mode === 'top' ? new THREE.Vector3(0, 43, 0.1) : mode === 'focus' ? new THREE.Vector3(2, current.camera.aspect < 1 ? 18 : 15, current.camera.aspect < 1 ? 6 : 5) : new THREE.Vector3(23, 22, 28)
      transition = { from: current.camera.position.clone(), to: target.clone().add(offset), targetFrom: current.controls.target.clone(), targetTo: target, progress: reduced.matches ? 1 : 0 }
      focusedKey = `${zone.id}:${cut}`
    }
    const cancelTravel = () => { transition = null; following = false; setCameraMode('perspective') }
    current.controls.addEventListener('start', cancelTravel)

    const water = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0x6fe3ff, transparent: true, opacity: 0.95 }), 90)
    water.frustumCulled = false
    current.scene.add(water)
    const leakParticles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshStandardMaterial({ color: 0x49beed, metalness: 0.12, roughness: 0.12, transparent: true, opacity: 0.82 }), 48)
    leakParticles.frustumCulled = false
    current.scene.add(leakParticles)
    const jet = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x2db5e5, transparent: true, opacity: 0.65, roughness: 0.12, metalness: 0.12, depthWrite: false }))
    current.scene.add(jet)
    let jetKey = ''
    const highlightedBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 1, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xec7955, transparent: true, opacity: 0.4, depthWrite: false }))
    highlightedBranch.rotation.z = Math.PI / 2
    current.scene.add(highlightedBranch)
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.65, 48), new THREE.MeshBasicMaterial({ color: 0xdc634e, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2
    current.scene.add(ring)
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0x337c8d, transparent: true, opacity: 0.46, metalness: 0.2, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }))
    puddle.rotation.x = -Math.PI / 2
    current.scene.add(puddle)
    const dummy = new THREE.Object3D()
    const projected = new THREE.Vector3()
    const jetOffset = new THREE.Vector3()
    function placePin(element: HTMLElement | null | undefined, x: number, y: number, z: number, visible = true) {
      if (!element || !host.current) return
      projected.set(x, y, z).project(current.camera)
      const width = host.current.clientWidth, height = host.current.clientHeight
      const px = (projected.x * 0.5 + 0.5) * width, py = (-projected.y * 0.5 + 0.5) * height
      element.style.transform = `translate(${px}px, ${py}px) translate(-50%, -100%)`
      const portraitPhone = width <= 640 && height > 520
      const bottomInset = portraitPhone ? 170 : 112
      const topInset = portraitPhone ? 135 : 90
      element.style.visibility = visible && projected.z > -1 && projected.z < 1 && px > 40 && px < width - 40 && py > topInset && py < height - bottomInset ? 'visible' : 'hidden'
    }
    current.setUpdate((_time, delta) => {
      const { state: s, cutaway: cut } = options.current
      if (s.elapsedSeconds < previousElapsed) { animationTime = 0; flowOffsets.fill(0) }
      previousElapsed = s.elapsedSeconds
      const motionDelta = !s.paused && !reduced.matches ? delta * s.speed : 0
      animationTime += motionDelta
      if (following && focusedKey !== `${s.detectedZone ?? s.selectedZone}:${cut}`) cameraCommand.current('focus')
      if (transition) {
        transition.progress = Math.min(1, transition.progress + delta / 0.9)
        const t = transition.progress * transition.progress * (3 - 2 * transition.progress)
        current.camera.position.lerpVectors(transition.from, transition.to, t)
        current.controls.target.lerpVectors(transition.targetFrom, transition.targetTo, t)
        current.controls.update()
        if (transition.progress === 1) transition = null
      }
      if (farm && shownCutaway !== cut) {
        shownCutaway = cut
        for (const material of soilMaterials) { material.clippingPlanes = cut ? TRENCH_PLANES : null; material.needsUpdate = true }
        trench.visible = cut
        if (buriedPipes) buriedPipes.visible = cut
        for (const group of deviceGroups) if (group.userData.zone === 'B') group.visible = cut
      }
      const readings = getReadings(s)
      let index = 0
      ZONES.forEach((zone, zoneIndex) => {
        const reading = readings.zones[zoneIndex]
        const visible = zone.kind !== 'buried' || cut
        const flowing = reading.upstreamFlowLpm > 0 && visible
        const start = -8, end = zone.id === 'A' ? -1 : 9
        if (reading.upstreamFlowLpm > 0) flowOffsets[zoneIndex] += motionDelta
        const inletVelocity = Math.max(0.001, reading.upstreamFlowLpm / zone.baselineFlowLpm * 1.6)
        const outletVelocity = Math.max(0.001, reading.downstreamFlowLpm / zone.baselineFlowLpm * 1.6)
        const inletTime = (zone.x - start) / inletVelocity
        const travelTime = inletTime + (end - zone.x) / outletVelocity
        for (let particle = 0; particle < 30; particle++) {
          const t = (particle / 30 * travelTime + flowOffsets[zoneIndex]) % travelTime
          const x = t < inletTime ? start + t * inletVelocity : zone.x + (t - inletTime) * outletVelocity
          const downstreamRatio = x > zone.x && reading.upstreamFlowLpm ? reading.downstreamFlowLpm / reading.upstreamFlowLpm : 1
          dummy.position.set(x, zone.kind === 'buried' ? -0.825 : 0.63, zone.z)
          dummy.scale.set(flowing ? 1.75 * downstreamRatio : 0, flowing ? 0.58 : 0, flowing ? 0.58 : 0)
          dummy.updateMatrix()
          water.setMatrixAt(index++, dummy.matrix)
        }
        const valve = valves[zoneIndex]
        valve.group.visible = visible
        valve.wheel.rotation.y = reading.isolated ? Math.PI / 2 : 0
        valve.material.color.set(reading.isolated ? 0xc95e46 : 0x278b9c)
        placePin(labels.current[zoneIndex], zone.x, zone.kind === 'buried' && cut ? -0.2 : 1.55, zone.z)
      })
      water.instanceMatrix.needsUpdate = true
      for (const { mesh, zoneIndex, side } of signals) {
        const reading = readings.zones[zoneIndex]
        const pulse = reading.upstreamFlowLpm > 0 ? (animationTime * 0.65 + side * 0.25) % 1 : 0
        mesh.scale.setScalar(reduced.matches ? 1 : 1 + pulse * 2.5)
        mesh.material.opacity = reading.upstreamFlowLpm > 0 ? (reduced.matches ? 0.42 : (1 - pulse) * 0.65) : 0.10
        mesh.material.color.set(reading.isolated ? 0x97abae : reading.leakFlowLpm > 0 && side === 1 ? 0xffa567 : 0x62d4fa)
      }
      const selected = ZONES.find(zone => zone.id === s.selectedZone)!
      pairFor(selected.id).forEach((x, i) => placePin(meterPins.current[i], x, selected.kind === 'buried' ? -0.22 : 1.22, selected.z, options.current.showReadouts && (selected.kind !== 'buried' || cut)))
      const damaged = ZONES.find(zone => zone.id === s.leakZone)
      const damagedReading = readings.zones.find(zone => zone.zoneId === s.leakZone)
      const active = !!damaged && !!damagedReading && damagedReading.leakFlowLpm > 0
      const visibleLeak = active && (damaged.kind !== 'buried' || cut)
      leakParticles.visible = visibleLeak
      jet.visible = visibleLeak
      puddle.visible = !!damaged && s.waterLostLiters > 0.015
      const located = s.phase === 'detected' || s.phase === 'isolated'
      ring.visible = located && !!damaged && (damaged.kind !== 'buried' || cut)
      highlightedBranch.visible = ring.visible
      if (damaged && damagedReading) {
        const buried = damaged.kind === 'buried'
        const pipeY = buried ? -1.05 : 0.4, sourceY = pipeY + 0.19
        highlightedBranch.position.set(damaged.id === 'A' ? -4.4 : 3.5, pipeY, damaged.z)
        highlightedBranch.scale.y = damaged.id === 'A' ? 4.8 : 7
        highlightedBranch.material.color.set(s.phase === 'isolated' ? 0x2d9b7b : 0xec7955)
        ring.position.set(damaged.x, buried ? -1.77 : 0.16, damaged.z)
        ring.scale.setScalar(1.05 + (reduced.matches ? 0 : Math.sin(animationTime * 2) * 0.10))
        ring.material.color.copy(highlightedBranch.material.color)
        puddle.position.set(damaged.x + 0.12, buried && cut ? -1.775 : 0.11, damaged.z + (buried ? 0.23 : 0.55))
        const wetSize = Math.min(1.25, 0.28 + Math.sqrt(s.waterLostLiters) * 0.36)
        puddle.scale.set(wetSize, wetSize * (buried ? 0.56 : 0.65), 1)
        puddle.material.color.set(buried ? 0x3b5146 : 0x337c8d)
        puddle.material.opacity = buried && !cut ? 0.35 : 0.48
        const geometryKey = `${damaged.id}:${s.severity}:${damagedReading.pressureBar}`
        if (visibleLeak && jetKey !== geometryKey) {
          jetKey = geometryKey
          const points = Array.from({ length: 20 }, (_, i) => jetPoint(i / 19, damagedReading.pressureBar, s.severity, buried, new THREE.Vector3()))
          jet.geometry.dispose()
          jet.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.018 + s.severity * 0.0003, 6, false)
        }
        jet.position.set(damaged.x, sourceY, damaged.z)
        if (visibleLeak) {
          for (let p = 0; p < 48; p++) {
            const t = (animationTime * (0.9 + damagedReading.pressureBar * 0.18) + p / 48) % 1
            jetPoint(t, damagedReading.pressureBar, s.severity, buried, jetOffset)
            const scatter = t * (buried ? 0.035 : 0.09)
            dummy.position.set(damaged.x + jetOffset.x + Math.sin(p * 2.399) * scatter, sourceY + jetOffset.y, damaged.z + jetOffset.z + Math.cos(p * 2.399) * scatter)
            dummy.scale.setScalar((0.45 + s.severity / 140) * (1 - t * 0.4))
            dummy.updateMatrix()
            leakParticles.setMatrixAt(p, dummy.matrix)
          }
          leakParticles.instanceMatrix.needsUpdate = true
        }
      }
    })
    return () => { cameraCommand.current = () => {}; current.controls.removeEventListener('start', cancelTravel); current.dispose(); stage.current = null }
  }, [])
  useEffect(() => {
    if (cameraRequest && cameraRequest.sequence > 0 && status === 'ready') {
      setCameraMode(cameraRequest.mode)
      cameraCommand.current(cameraRequest.mode)
    }
  }, [cameraRequest, status])
  function setCamera(mode: CameraMode) { setCameraMode(mode); cameraCommand.current(mode) }
  const selected = ZONES.find(zone => zone.id === state.selectedZone)!
  const selectedReading = getReadings(state).zones.find(zone => zone.zoneId === state.selectedZone)!
  return <div className="farm-viewport" tabIndex={0} role="region" aria-label="مزرعة مسار ثلاثية الأبعاد — استخدم الأسهم للتدوير وزائد وناقص للتقريب">
    <div className="canvas-host" ref={host} />
    {status === 'loading' && <div className="scene-loading"><LoaderCircle className="spin" size={26} /><span>نجهّز المزرعة وشبكة الري</span></div>}
    {status === 'error' && <div className="scene-fallback"><p>تعذّر تحميل المزرعة ثلاثية الأبعاد</p><span>يمكنك متابعة المحاكاة وقراءة نتائج الحساسات من اللوحات</span><button className="button secondary" onClick={() => location.reload()}>إعادة المحاولة</button></div>}
    {status === 'ready' && <>
      <div className="farm-focus-summary"><strong>القطاع {selected.id} · {selected.kind === 'buried' ? 'خط مدفون' : 'خط سطحي'}</strong><span>{selected.kind === 'buried' && !cutaway ? 'افتح المقطع الأرضي لرؤية الخط والحساسات' : selectedReading.isolated ? 'الصمام مغلق · توقف التدفق في القطاع' : `ضغط القطاع ${selectedReading.pressureBar.toFixed(2)} بار · اتجاه التدفق من الدخول إلى الخروج`}</span></div>
      <div className="farm-labels">{ZONES.map((zone, i) => <button key={zone.id} ref={el => { labels.current[i] = el }}
        className={`farm-pin ${state.selectedZone === zone.id ? 'selected' : ''} ${state.detectedZone === zone.id ? 'detected' : ''}`}
        onClick={() => onZone(zone.id)} disabled={!!state.leakZone && state.leakZone !== zone.id}
        aria-label={`اختيار القطاع ${zone.id} — ${zone.kind === 'buried' ? 'ري مدفون' : 'ري ظاهر'}`} aria-pressed={state.selectedZone === zone.id}>
        <span>{zone.id}</span>{state.detectedZone === zone.id ? (state.phase === 'isolated' ? 'تم العزل' : 'نطاق التسريب') : zone.kind === 'buried' ? 'ري مدفون' : 'ري ظاهر'}
      </button>)}
      {(['inlet', 'outlet'] as const).map((side, i) => <div key={side} ref={element => { meterPins.current[i] = element }} className={`meter-readout ${side}`} style={{ visibility: 'hidden' }}>
        <span className="meter-readout-label">{i === 0 ? 'حساس الدخول' : 'حساس الخروج'} · {selected.id}</span>
        <strong dir="ltr">{(i === 0 ? selectedReading.upstreamFlowLpm : selectedReading.downstreamFlowLpm).toFixed(1)} <small>لتر/د</small></strong>
        <small>{selectedReading.isolated ? 'معزول' : !state.pumpOn ? 'المضخة متوقفة' : i === 1 && selectedReading.leakFlowLpm > 0 ? `فرق ${selectedReading.leakFlowLpm.toFixed(1)} لتر/د` : 'تدفق منتظم'}</small>
      </div>)}
      </div>
    </>}
    <div className="farm-camera"><div className="segmented"><button className={cameraMode === 'perspective' ? 'active' : ''} aria-pressed={cameraMode === 'perspective'} onClick={() => setCamera('perspective')}><Focus size={15} /> منظور حر</button><button className={cameraMode === 'top' ? 'active' : ''} aria-pressed={cameraMode === 'top'} onClick={() => setCamera('top')}>من الأعلى</button></div>
      <div className="scene-actions"><button className="farm-track-button" aria-label="تتبّع القطاع المختار" aria-pressed={cameraMode === 'focus'} onClick={() => setCamera('focus')}><Crosshair size={17} /><span>تتبّع القطاع</span></button><button aria-label="تقريب المزرعة" onClick={() => stage.current?.zoom(0.83)}><ZoomIn size={17} /></button><button aria-label="إبعاد المزرعة" onClick={() => stage.current?.zoom(1.17)}><ZoomOut size={17} /></button><button aria-label="إعادة زاوية المزرعة" onClick={() => setCamera('perspective')}><RotateCcw size={17} /></button></div>
    </div>
  </div>
}
