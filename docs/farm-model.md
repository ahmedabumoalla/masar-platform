# Masar farm asset

Created in Blender 4.5.3 LTS on 2026-09-21 with deterministic seed 28

- Generator: `scripts/build_farm.py`
- Editable source: `assets/blender/masar-farm.blend`
- Web asset: `public/models/masar-farm.glb` — 1,093,292 bytes, 32 mesh objects, 20,442 triangles
- Render: `docs/reference/farm-preview.png` — 1000 × 750, Cycles 24 samples, visually inspected after removing overlapping path surfaces
- Structured measurements: `docs/reference/farm-metadata.json`

The scene includes layered earth, cultivated lettuce, corn and herb plots, a six-tree orchard made of branches and tapered leaf geometry, framed greenhouse, ribbed water tank, pump, solar control shed, limestone paths and cedar boundary fencing

## Runtime contract

glTF is Y-up and centered on the ground surface, with Blender conversion `(x, y, z) → (x, -z, y)` during construction. Measured web bounds: `[-12, -2.4, -9.006]` to `[12, 2.7933, 9.006]`. Tiny stone fragments extend 0.006 beyond the terrain edge

| Root group | Contents | Layer behavior |
| --- | --- | --- |
| `TerrainSurface` | Thin turf, soil ridges, paths | Fade or hide with cutaway |
| `Soil` | Three earth strata, cut-edge stone fragments | Fade or hide with cutaway |
| `BuriedPipes` | Independent buried B branch, trunk feed, far riser | Reveal with cutaway |
| `SurfacePipes` | Main trunk, A/C branches, fittings, drip tubes | Remain visible |
| `Plants` | Leaves, stems, trunks, citrus | Independent of terrain visibility |
| `Infrastructure` | Buildings, tank, pump, fences and pipe supports | Remain visible |

Pipe centerlines in web coordinates:

- Trunk: `x=-8, y=0.4, z=-6…7`
- A: `x=-8…-1, y=0.4, z=-3`
- B: `x=-8…9, y=-1.05, z=-3`, supplied vertically from the trunk at `x=-8`, independently of A
- C: `x=-8…9, y=0.4, z=4`
- Leak anchors: A `[-5,0.4,-3]`, B `[4,-1.05,-3]`, C `[4,0.4,4]`
- Meter sockets point along X; mount A at `x=-6.8,-2`, B and C at `x=0,7`

Use separately loaded meters and runtime water particles. The GLB contains no cameras, lights, textures, compression extension or external resources. Meshes are merged by layer/material, preserving layer control with low draw-call overhead. Materials may be shared across groups; clone before changing material properties for only one group. Changing root visibility needs no material clone

Runtime refinement (2026-09-21): `farm-effects.ts` supplies an intersected five-plane trench at x -8.7…9.5, z -4.1…-1.9, above y -1.8, with three visible soil strata. Soil outside this trench stays opaque. `FarmViewer` mounts device v2 at its original assembled transforms, adds valve wheels and crown tracers, projects live sensor readings, and uses an elevated focus angle to see below the trench rim. The buried rupture stays below ground and above the trench floor; surface mode displays only a wet patch. Flow velocities, rupture strength and valve state use the existing simulation readings. Wet patches persist after isolation and disappear on repair/reset. These are illustrative runtime effects, not a fluid solver

## Verification

Run: `blender --background --python scripts/build_farm.py`

On 2026-09-21 this command completed successfully in Blender 4.5.3, exported the GLB below the 8 MiB budget, measured geometry bounds and rendered the final preview. Inspected final composition and pipeline visibility in the rendered image. This is an illustrative farm model without surveyed dimensions or a validated hydraulic layout. Browser inspection was not used
