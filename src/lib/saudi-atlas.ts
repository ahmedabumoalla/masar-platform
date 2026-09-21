import geography from '../data/saudi-geography.json'
import { localProfiles, regionProfiles } from './saudi-agriculture'

export const atlas = geography
export type AtlasPlace = typeof atlas.places[number]
export type Camera = { x: number; y: number; zoom: number }
export const HOME_CAMERA: Camera = { x: 400, y: 320, zoom: 1 }

export function normalizeArabic(text: string) {
  return text.normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase().trim()
}

export function profileFor(place: AtlasPlace) {
  return localProfiles[place.key] ?? regionProfiles[place.region]
}

export function filterPlaces(region: string, query: string) {
  const search = normalizeArabic(query)
  return atlas.places.filter(place => (region === 'all' || place.region === region)
    && (!search || normalizeArabic(`${place.name} ${place.key}`).includes(search)))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
}

export function boundedCamera(camera: Camera): Camera {
  return { x: Math.max(0, Math.min(800, camera.x)), y: Math.max(0, Math.min(640, camera.y)), zoom: Math.max(1, Math.min(7, camera.zoom)) }
}

export function regionCamera(id: string): Camera {
  const region = atlas.regions.find(item => item.id === id)
  if (!region) return HOME_CAMERA
  const [x1, y1, x2, y2] = region.bounds
  return boundedCamera({ x: (x1 + x2) / 2, y: (y1 + y2) / 2, zoom: Math.min(700 / (x2 - x1 + 50), 550 / (y2 - y1 + 50)) })
}

export function mapView(width: number, height: number, camera: Camera) {
  const scale = Math.max(.1, Math.min(width / atlas.width, height / atlas.height)) * camera.zoom
  const w = width / scale, h = height / scale
  return { x: camera.x - w / 2, y: camera.y - h / 2, width: w, height: h, scale }
}

export function nextDirectionalPlace(current: AtlasPlace, places: AtlasPlace[], key: string) {
  const horizontal = key === 'ArrowLeft' || key === 'ArrowRight'
  const axis = horizontal ? 0 : 1
  const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1
  return places.filter(place => (place.point[axis] - current.point[axis]) * direction > .01)
    .sort((a, b) => {
      const score = (p: AtlasPlace) => Math.abs(p.point[axis] - current.point[axis]) + Math.abs(p.point[1 - axis] - current.point[1 - axis]) * 2
      return score(a) - score(b)
    })[0]
}
