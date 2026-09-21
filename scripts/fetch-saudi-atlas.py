"""Download pinned, openly licensed map inputs once; no network at app runtime."""
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'docs/reference/saudi-atlas'
CACHE.mkdir(parents=True, exist_ok=True)
for level in ('ADM1', 'ADM2'):
    meta_path = CACHE / f'{level}-metadata.json'
    if not meta_path.exists():
        url = f'https://www.geoboundaries.org/api/current/gbOpen/SAU/{level}/'
        meta_path.write_bytes(urllib.request.urlopen(url, timeout=40).read())
    meta = json.loads(meta_path.read_text('utf-8'))
    path = CACHE / f'{level}.geojson'
    if not path.exists():
        path.write_bytes(urllib.request.urlopen(meta['simplifiedGeometryGeoJSON'], timeout=60).read())
    data = json.loads(path.read_text('utf-8'))
    print(level, len(data['features']), meta['boundaryLicense'])
    for i, feature in enumerate(data['features']):
        print(i, json.dumps(feature['properties'], ensure_ascii=True))
