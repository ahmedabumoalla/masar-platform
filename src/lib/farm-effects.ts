import * as THREE from 'three'
import { ZONES } from './simulation'

/** Negative half-spaces intersect ONLY inside this trench; soil outside remains solid. */
export const TRENCH_PLANES = [
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), -8.7),
  new THREE.Plane(new THREE.Vector3(1, 0, 0), -9.5),
  new THREE.Plane(new THREE.Vector3(0, 0, -1), -4.1),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), 1.9),
  new THREE.Plane(new THREE.Vector3(0, -1, 0), -1.8),
]

export function createTrench() {
  const group = new THREE.Group()
  group.name = 'Local soil cross-section'
  const strata = [
    { top: 0.03, bottom: -0.55, color: 0x654631 },
    { top: -0.55, bottom: -1.1, color: 0x8b6546 },
    { top: -1.1, bottom: -1.8, color: 0xae865b },
  ]
  for (const { top, bottom, color } of strata) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 1 })
    for (const z of [-4.095, -1.905]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(18.2, top - bottom, 0.035), material)
      wall.position.set(0.4, (top + bottom) / 2, z)
      wall.receiveShadow = true
      group.add(wall)
    }
    for (const x of [-8.695, 9.495]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.035, top - bottom, 2.2), material)
      wall.position.set(x, (top + bottom) / 2, -3)
      wall.receiveShadow = true
      group.add(wall)
    }
  }
  const floor = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.025, 2.2), new THREE.MeshStandardMaterial({ color: 0x765942, roughness: 1 }))
  floor.position.set(0.4, -1.8, -3)
  floor.receiveShadow = true
  group.add(floor)
  group.visible = false
  return group
}

export function createValves() {
  return ZONES.map(zone => {
    const group = new THREE.Group()
    group.position.set(zone.id === 'A' ? -7.5 : -6.9, zone.kind === 'buried' ? -1.05 : 0.4, zone.z)
    const metal = new THREE.MeshStandardMaterial({ color: 0x9aaeb5, roughness: 0.35, metalness: 0.8 })
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.46, 10), metal)
    stem.position.y = 0.35
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.32, 16), metal)
    body.rotation.z = Math.PI / 2
    group.add(stem, body)
    const wheel = new THREE.Group()
    wheel.position.y = 0.6
    const material = new THREE.MeshStandardMaterial({ color: 0x278b9c, metalness: 0.3, roughness: 0.3 })
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 24), material)
    rim.rotation.x = Math.PI / 2
    wheel.add(rim)
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.045, 0.045), material)
      const angle = i * Math.PI * 2 / 3
      spoke.position.set(Math.cos(angle) * 0.13, 0, Math.sin(angle) * 0.13)
      spoke.rotation.y = -angle
      wheel.add(spoke)
    }
    // Contrasting pointer makes the quarter-turn open/closed position legible.
    const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.055, 0.085), metal)
    pointer.position.x = 0.27
    wheel.add(pointer)
    group.add(wheel)
    return { group, wheel, material }
  })
}

/** Directed rupture: one coherent side jet, not a decorative radial fountain. */
export function jetPoint(t: number, pressure: number, severity: number, buried: boolean, target: THREE.Vector3) {
  const strength = Math.sqrt(Math.max(pressure, 0) / 3.2) * (0.45 + severity / 120)
  if (buried) {
    // Source at pipe crown -0.86, ceiling remains below the ground, landing on trench floor.
    target.set(0.12 * t, 0.28 * Math.sin(t * Math.PI) - 0.90 * t * t, 0.64 * strength * t)
  } else {
    target.set(0.36 * t, 1.95 * strength * t - (1.95 * strength + 0.50) * t * t, 1.70 * strength * t)
  }
  return target
}
