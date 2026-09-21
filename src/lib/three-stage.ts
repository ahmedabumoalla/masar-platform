import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function createStage(host: HTMLDivElement, farm = false) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(farm ? 36 : 34, 1, 0.1, 200)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, farm ? 1.25 : 1.65))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = farm ? 0.95 : 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.localClippingEnabled = true
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.075
  controls.enablePan = false
  controls.enableZoom = farm
  controls.minDistance = farm ? 5.5 : 3
  controls.maxDistance = farm ? 70 : 42
  controls.minPolarAngle = 0.1
  controls.maxPolarAngle = farm ? Math.PI / 2.08 : Math.PI / 1.4
  const defaultCamera = farm ? new THREE.Vector3(23, 22, 28) : new THREE.Vector3(3.4, 2.5, 11.4)
  camera.position.copy(defaultCamera)
  controls.target.set(0, farm ? 0 : 0.05, 0)
  controls.update()

  const room = new RoomEnvironment()
  const generator = new THREE.PMREMGenerator(renderer)
  const environment = generator.fromScene(room, 0.04)
  scene.environment = environment.texture
  scene.environmentIntensity = farm ? 0.65 : 1
  room.dispose()
  generator.dispose()
  scene.add(new THREE.HemisphereLight(0xf0f7ff, 0x81917c, farm ? 1.25 : 1.8))
  const key = new THREE.DirectionalLight(0xfff7ec, farm ? 2 : 2.6)
  key.position.set(-8, 16, 12)
  key.castShadow = true
  key.shadow.mapSize.set(farm ? 1024 : 2048, farm ? 1024 : 2048)
  const extent = farm ? 20 : 8
  Object.assign(key.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, far: 70 })
  key.shadow.normalBias = 0.03
  key.shadow.bias = -0.0001
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xcce4ff, farm ? 0.9 : 1.4)
  fill.position.set(9, 5, -5)
  scene.add(fill)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: farm ? 0.11 : 0.09 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = farm ? -2.45 : -1.8
  ground.receiveShadow = true
  scene.add(ground)

  function resize() {
    const width = host.clientWidth
    const height = host.clientHeight
    if (!width || !height) return
    camera.aspect = width / height
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(farm ? 36 : 34) / 2) / Math.min(camera.aspect, 1)))
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()
  let visible = true
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  intersection.observe(host)
  let frame = 0
  let last = 0
  let disposed = false
  let update = (_time: number, _delta: number) => {}
  const draw = (time: number) => {
    if (disposed) return
    frame = requestAnimationFrame(draw)
    if (!visible || document.hidden || time - last < 28) return
    const delta = Math.min((time - last) / 1000, 0.1)
    last = time
    update(time / 1000, delta)
    controls.update()
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(draw)
  function keydown(event: KeyboardEvent) {
    if (event.target !== host.parentElement) return
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(event.key)) return
    event.preventDefault()
    const offset = camera.position.clone().sub(controls.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    if (event.key === 'ArrowLeft') spherical.theta -= 0.15
    if (event.key === 'ArrowRight') spherical.theta += 0.15
    if (event.key === 'ArrowUp') spherical.phi -= 0.1
    if (event.key === 'ArrowDown') spherical.phi += 0.1
    if (event.key === '+' || event.key === '=') spherical.radius *= 0.9
    if (event.key === '-') spherical.radius *= 1.1
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle)
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance)
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical))
    controls.update()
  }
  host.parentElement?.addEventListener('keydown', keydown)
  return {
    scene, camera, controls, renderer, ground,
    get disposed() { return disposed },
    setUpdate(callback: typeof update) { update = callback },
    reset() { camera.position.copy(defaultCamera); controls.target.set(0, farm ? 0 : 0.05, 0); controls.update() },
    zoom(factor: number) {
      const distance = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * factor, controls.minDistance, controls.maxDistance)
      camera.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target)
      controls.update()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      host.parentElement?.removeEventListener('keydown', keydown)
      controls.dispose()
      disposeObject(scene)
      environment.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

export function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  object.traverse(child => {
    if (child instanceof THREE.DirectionalLight) child.shadow.dispose()
    if (child instanceof THREE.InstancedMesh) child.dispose()
    if (child instanceof THREE.Mesh) {
      geometries.add(child.geometry)
      for (const mat of Array.isArray(child.material) ? child.material : [child.material]) {
        materials.add(mat)
        for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value)
      }
    }
  })
  geometries.forEach(item => item.dispose())
  textures.forEach(item => item.dispose())
  materials.forEach(item => item.dispose())
}

export type Stage = ReturnType<typeof createStage>
