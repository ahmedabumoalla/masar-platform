# Saudi agricultural atlas

Home section after the hero; `src/components/SaudiAtlas.tsx` and its scoped stylesheet. Lazy local SVG, no tiles, geolocation, account, secret, API key or runtime data service. Search normalizes Arabic diacritics/alef variants; region filter, native governorate selector, pointer selection/pan, zoom/reset and directional keyboard selection share one camera/selection model. The map spans the full section below a compact responsive filter toolbar. Place activation opens `AtlasPlaceDialog` with the profile and sources; there is no permanent sidebar. Arrow navigation only explores markers until Enter/Space opens the modal. Native dialog closes with Escape/close, restores focus and owns temporary page scroll locking.

## Content and coverage

152 representative locations: 147 geoBoundaries ADM2 records (including regional capitals), supplemented by Dammam, Al Bayda, Al Muwayh, Al Amwah and Abanat. All 13 regions are represented. This is geographic coverage, **not 152 independently researched agricultural profiles**. `src/lib/saudi-agriculture.ts` holds 13 sourced regional profiles and five source-backed local profiles: Ahsa, Taif, AlUla, Bishah and Ad Dair. Others display an explicit regional fallback, hollow circles and a local-evidence limitation. No provincial ranking, percentage, water dominance, live readings or surveyed well locations are invented. Wells are groundwater extraction, not a separate water resource. Agriculture/irrigation context is separate from municipal drinking-water supply.

Primary publications are linked beside water/crop claims inside each profile. Ahsa includes dates and locally confirmed Hasawi lime. Sources were reviewed 2026-09-21; the editorial review date is not the publication date or a live refresh date. Local evidence may describe specific projects, never all farms.

## Reproduce the map

1. `python scripts/fetch-saudi-atlas.py` downloads geoBoundaries metadata and simplified ADM1/ADM2 into the existing reference cache only when missing
2. For offline asset generation only: `python -m pip install --target .tools/atlas-python shapely==2.1.2` (Python 3.14 here, NumPy 2.5.3 installed transitively)
3. `python scripts/build-saudi-atlas.py` writes matching app/public geographic JSON

Regional outlines dissolve the 2021 county shapes by region. The separate 2017 ADM1 national silhouette fills coverage gaps. Combining original ADM1 regional borders with newer ADM2 points exposed three mismatches (Sharurah, Farat Ghamid Az Zinad, Al Birk); the generator now validates containment against the dissolved county outlines and checks supplementary seats against uncovered background where needed. No point is arbitrarily moved into another province. Ahsa uses its oasis rather than the large desert polygon centre. Markers are representative positions, not the administrative headquarters except approximate supplemental seats.

Al Bayda uses the official Eastern Province emirate's map marker [49.969639,26.361361]; Al Amwah uses GeoNames [43.65635,18.71429]. All coordinates use longitude first. Sources, adaptations and separate ODbL/CC BY-SA attribution are published at `/data/saudi-atlas-licenses.txt`; adapted data at `/data/saudi-geography.json`. Map is illustrative, not cadastral/current legal boundary evidence.

## Verification scope

`npm run test:atlas` covers geographic/content coverage, local/regional provenance, source URLs, Arabic search, filters, projection/framing at mobile/desktop sizes, camera bounds, directional navigation and published data parity. Generator assertions verify geographic containment. `npm run build` checks strict TypeScript and Vite integration. Source review covers SVG group/button semantics, one reachable marker plus native list alternative, 44px map controls, mobile order, focus states, reduced-motion (no map animations) and no page-scroll interception until zoomed. Browser rendering and physical touch behavior were not inspected for this task.
