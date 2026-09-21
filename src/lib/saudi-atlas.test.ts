import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { atlas, boundedCamera, filterPlaces, HOME_CAMERA, mapView, nextDirectionalPlace, normalizeArabic, profileFor, regionCamera } from './saudi-atlas'
import { localProfiles, regionProfiles } from './saudi-agriculture'

test('all 13 regions, capitals and mapped governorates resolve to traceable, correctly scoped profiles', () => {
  assert.equal(atlas.regions.length, 13)
  assert.equal(new Set(atlas.places.map(place => place.id)).size, atlas.places.length)
  assert.equal(atlas.places.filter(place => place.capital).length, 13)
  assert.deepEqual(Object.keys(regionProfiles).sort(), atlas.regions.map(region => region.id).sort())
  for (const region of atlas.regions) {
    assert.ok(atlas.places.some(place => place.region === region.id && place.capital))
    assert.ok(region.path.startsWith('M') && region.path.endsWith('Z'))
  }
  for (const place of atlas.places) {
    const profile = profileFor(place)
    assert.ok(profile)
    assert.equal(profile.scope, Object.hasOwn(localProfiles, place.key) ? 'local' : 'region')
    assert.ok(profile.crops.length && profile.waterSources.length && profile.cropSources.length)
    for (const source of [...profile.waterSources, ...profile.cropSources]) assert.equal(new URL(source.url).protocol, 'https:')
    assert.ok(place.point.every(Number.isFinite))
    assert.ok(place.point[0] >= 0 && place.point[0] <= atlas.width && place.point[1] >= 0 && place.point[1] <= atlas.height)
  }
  for (const key of Object.keys(localProfiles)) assert.ok(atlas.places.some(place => place.key === key), `Orphan local profile: ${key}`)
})

test('Arabic search tolerates spelling variants, respects region filters and handles no results', () => {
  assert.equal(normalizeArabic('الأَحْسَاء'), normalizeArabic('الاحساء'))
  assert.equal(filterPlaces('all', 'الاحساء')[0].key, 'Al Ahsa Governorate')
  assert.equal(filterPlaces('SA-01', 'الاحساء').length, 0)
  assert.ok(filterPlaces('SA-03', 'المدينه').some(place => place.capital))
  assert.equal(filterPlaces('all', 'لاوجودلهذاالاسم').length, 0)
  for (const region of atlas.regions) assert.ok(filterPlaces(region.id, '').every(place => place.region === region.id))
})

test('mobile and desktop projection preserve north, east and a complete initial national view', () => {
  for (const [width, height] of [[296, 355], [366, 400], [780, 620]]) {
    const view = mapView(width, height, HOME_CAMERA)
    for (const place of atlas.places) {
      const [x, y] = place.point
      assert.ok(x >= view.x && x <= view.x + view.width && y >= view.y && y <= view.y + view.height, place.name)
    }
    assert.ok(Math.abs(view.width / view.height - width / height) < 1e-8)
  }
  const haql = atlas.places.find(place => place.key === 'Haqil')!
  const najran = atlas.places.find(place => place.key === 'Najran')!
  assert.ok(haql.point[0] < najran.point[0] && haql.point[1] < najran.point[1])
})

test('zoom, reset and keyboard navigation keep meaningful reachable selections', () => {
  assert.deepEqual(regionCamera('all'), HOME_CAMERA)
  assert.deepEqual(boundedCamera({ x: -100, y: 1000, zoom: 90 }), { x: 0, y: 640, zoom: 7 })
  for (const region of atlas.regions) {
    const camera = regionCamera(region.id)
    assert.ok(camera.zoom >= 1 && camera.zoom <= 7)
  }
  const ahsa = atlas.places.find(place => place.key === 'Al Ahsa Governorate')!
  const west = nextDirectionalPlace(ahsa, atlas.places, 'ArrowLeft')!
  assert.ok(west.point[0] < ahsa.point[0])
  assert.equal(nextDirectionalPlace(ahsa, [ahsa], 'ArrowRight'), undefined)
})

test('published adapted geographic database matches the app and includes licensed source attribution', () => {
  const published = JSON.parse(readFileSync('public/data/saudi-geography.json', 'utf8'))
  assert.deepEqual(published, atlas)
  const license = readFileSync('public/data/saudi-atlas-licenses.txt', 'utf8')
  assert.ok(license.includes('OpenStreetMap') && license.includes('ODbL') && license.includes('ShareAlike'))
})
