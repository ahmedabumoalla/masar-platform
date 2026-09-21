# Masar device presentation model

Built from `docs/reference/page-06.png` and the extracted `device-exploded.png` supplied with the project. The steel body, horizontal hex union fittings, blue face and vertical red display follow the concept reference. Internal parts are reference-based visual approximations, not manufacturing CAD or verified specifications.

## Assets and rebuilding

- `assets/blender/masar-device.blend`: editable components, materials, lighting and camera
- `public/models/masar-device.glb`: self-contained glTF 2.0 with 8 part roots and 33 material-batched mesh primitives, 2,149,160 bytes
- `public/images/device-render.png`: 1200 × 1000 transparent product preview
- `scripts/build_device.py`: deterministic Blender 4.5 Python builder

Run `blender --background --python-exit-code 1 --python scripts/build_device.py`. Append `-- --skip-render` to update exports without rerendering an unchanged assembled appearance. The blend retains individually editable meshes; the web export bakes evaluated vertices and normals directly into each root's local coordinate frame, then batches meshes sharing a material. This avoids transform errors from joining objects after rebasing their parents. No external textures, fonts, libraries or decoder are required by the GLB.

## Coordinate and interaction contract

The assembled model is centred near the origin. In Blender, pipes run along X and the display faces negative Y. The exported glTF uses Y up and the display faces positive Z. Approximate assembled size is 5.73 × 3.06 × 2.25 in glTF XYZ presentation units, not physical metres. The cavity is deeper than the first version so all five internal assemblies fit in separate depth slabs with 0.065 units of clearance and remain inside the inner cylinder.

Every root uses `extras.layoutVersion = 2`. GLTFLoader exposes extras as `object.userData`. All metadata is already in **glTF / Three.js coordinates** and must not be transformed again. Each root sits at its own assembled bounding centre; its meshes have local positions relative to that centre.

| Root | Exploded Y bounds, rounded | Contents |
|---|---|---|
| Housing | -0.935 to 0.935 | Steel cup, bored pipe connectors, hex nuts and threaded rings |
| Turbine | 2.539 to 3.109 | Ivory impeller, shaft, magnetic pickup |
| Sensor | 4.013 to 4.320 | Pressure sensor PCB and hollow steel sensor can |
| Battery | 5.018 to 5.229 | Silver pouch cell, amber foil and leads |
| Wireless | 6.036 to 6.143 | Radio PCB, shield and copper antenna |
| PCB | 7.339 to 7.482 | Circular control PCB, controller, solder contacts and passives |
| Seal | 9.183 to 9.259 | Black circular gasket |
| Display | 11.211 to 11.553 | Polished lid, blue enamel face and 33.96 display |

Use `position = assembledOrigin + explode * progress` and `rotation = explodeRotation * progress`. `pivot` is `[0, 0, 0]` in each root's local space. All eight roots, including Housing, rotate -pi/2 around X in the exploded view. The opening normal becomes world +Y and all roots share the housing opening's X/Z centreline. Assembled geometry stays unchanged. `layoutVersion=2` still describes this transform contract; the asset URL uses `?v=3` for cache invalidation.

Offsets use evaluated geometry and a minimum 0.34 world-Y clearance, plus 0.42 projected vertical clearance for the elevated reference view. This prevents wide horizontal discs from hiding their neighbours. Actual final world gaps vary from 0.698 to 1.952, full stack height is 12.488. Metadata provides framing bounds. See `docs/reference/device-layout-verification.json` for exact values.

The web viewer adds a depth-tested translucent orange mesh layer to every primitive of the selected root, including display and black gasket materials. Selection moves the layer to the newly selected part without altering any original material. The sidebar retains its requested yellow selected state.

## Verification

Executed on 2026-09-21 with Blender 4.5.3 on Windows. The revised builder exported successfully with `--python-exit-code 1` and rendered the assembled PNG with Cycles at 40 samples plus denoising. Source assertions verified radial and depth containment of every internal assembly, four depth clearances, and seven exploded clearances. The latest upward-facing revision was exported with `--skip-render` because the assembled preview is unchanged. A 1000 × 1400 exploded render and the updated assembled preview were inspected locally: the turbine, pressure board, battery, wireless module, main PCB, seal and display are individually visible.

An initial Three.js export check caught distorted transforms in the old object-join batching step; direct baking of vertices into root-local space fixed it. The final GLB was parsed using the installed Three.js GLTFLoader under Node 20.20.2. Actual exported world vertices match all eight assembled and exploded source bounds within 0.00002 units, and all seven exported exploded gaps exceed 0.34; the opening normal is +Y and all root centres align in X/Z. Results and actual execution timestamp are in the JSON's `exportVerification`. These geometry assertions use Node without a browser. A separate focused browser review verified the opening and orange layers on the display, gasket, PCB and housing. These checks supersede the old front-facing layout evidence.

The preview is an artistic product illustration. The supplied concept does not define exact dimensions, tolerances, pressure ratings, certified electronics or a service procedure.
