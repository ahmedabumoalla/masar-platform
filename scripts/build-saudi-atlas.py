"""Build compact SVG geometry and representative points from pinned geoBoundaries.

Run fetch-saudi-atlas.py once first. Geometry is illustrative, not cadastral.
Regional shapes: OSM/geoBoundaries ODbL 1.0; county shapes: CC BY-SA 2.0.
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/atlas-python'))
from shapely import make_valid
from shapely.geometry import shape, mapping, Point
from shapely.ops import unary_union
CACHE = ROOT / 'docs/reference/saudi-atlas'
regions = json.loads((CACHE / 'ADM1.geojson').read_text('utf-8'))['features']
counties = json.loads((CACHE / 'ADM2.geojson').read_text('utf-8'))['features']
NAMES = '''الخبر|بقيق|الأحساء|العديد|النعيرية|القطيف|رأس تنورة|الجبيل|الخفجي|حفر الباطن|قرية العليا|عيون الجواء|المذنب|الأسياح|رياض الخبراء|عنيزة|عقلة الصقور|النبهانية|البدائع|البكيرية|ضرية|بريدة|الرس|الشماسية|موقق|بقعاء|حائل|الشنان|السليمي|الحائط|سميراء|الشملي|الغزالة|رفحاء|عرعر|طريف|العويقيلة|سكاكا|القريات|طبرجل|دومة الجندل|أملج|تيماء|الوجه|ضباء|البدع|تبوك|حقل|مرات|وادي الدواسر|ثادق|الدرعية|الدلم|ضرما|الغاط|السليل|حوطة بني تميم|المزاحمية|حريملاء|القويعية|الأفلاج|الزلفي|المجمعة|الخرج|شقراء|الحريق|الرياض|الدوادمي|الرين|رماح|عفيف|خباش|ثار|نجران|يدمة|شرورة|بدر الجنوب|حبونا|المدينة المنورة|المهد|ينبع|الحناكية|خيبر|العلا|العيص|وادي الفرع|بدر|الكامل|مكة المكرمة|القنفذة|جدة|خليص|تربة|الجموم|رابغ|الليث|رنية|الخرمة|بحرة|ميسان|العرضيات|أضم|بلجرشي|الحجرة|المخواة|قلوة|العقيق|القرى|بني حسن|المندق|الباحة|فرعة غامد الزناد|الحرث|ضمد|فيفاء|صامطة|فرسان|الدرب|صبيا|أحد المسارحة|العيدابي|الريث|الطوال|جازان|هروب|الدائر|العارضة|أبو عريش|بيش|ظهران الجنوب|أحد رفيدة|تثليث|أبها|طريب|بيشة|محايل عسير|البرك|الحرجة|بلقرن|بارق|المجاردة|النماص|سراة عبيدة|رجال ألمع|تنومة|خميس مشيط|الطائف'''.split('|')
REGION_NAMES = {'SA-01':'الرياض','SA-02':'مكة المكرمة','SA-03':'المدينة المنورة','SA-04':'الشرقية','SA-05':'القصيم','SA-06':'حائل','SA-07':'تبوك','SA-08':'الحدود الشمالية','SA-09':'جازان','SA-10':'نجران','SA-11':'الباحة','SA-12':'الجوف','SA-14':'عسير'}
RANGES = [(0,10,'04'),(11,23,'05'),(24,32,'06'),(33,36,'08'),(37,40,'12'),(41,47,'07'),(48,70,'01'),(71,77,'10'),(78,86,'03'),(87,101,'02'),(102,111,'11'),(112,128,'09'),(129,145,'14'),(146,146,'02')]
CAPITALS = {21,26,34,37,46,66,73,78,88,110,123,132}

# Preserve the differently licensed national background as a separate layer.
# Regional outlines are dissolved solely from ADM2, so a newer county (Al Birk)
# is not misleadingly shown inside a different region's older ADM1 outline.
national_background = mapping(unary_union([make_valid(shape(f['geometry'])) for f in regions]))
county_union = unary_union([make_valid(shape(f['geometry'])) for f in counties])
old_regions = {f['properties']['shapeISO']: f['geometry'] for f in regions}
for region in regions:
    code = region['properties']['shapeISO']
    assigned = [make_valid(shape(f['geometry'])) for i,f in enumerate(counties) if 'SA-'+next(value for start,end,value in RANGES if start<=i<=end) == code]
    region['geometry'] = mapping(unary_union(assigned))

def project(p):
    # Equirectangular projection with a 24 degree standard parallel, north up.
    return [round(28 + (p[0] - 34.4) * math.cos(math.radians(24)) * 36, 2), round(28 + (32.3 - p[1]) * 36, 2)]

def polygons(g):
    return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']

def area(ring):
    return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring,ring[1:])) / 2)

def inside(p, ring):
    x,y=p
    hit=False
    for a,b in zip(ring,ring[1:]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: hit=not hit
    return hit

def in_geometry(p, g):
    return any(inside(p, poly[0]) and not any(inside(p, hole) for hole in poly[1:]) for poly in polygons(g))

def representative(g, region_geometry):
    # Choose an interior point of the largest island, not a centroid outside a concave coast.
    poly=max(polygons(g),key=lambda p:area(p[0]))
    ring=poly[0]
    xs,ys=zip(*ring)
    cx,cy=(min(xs)+max(xs))/2,(min(ys)+max(ys))/2
    candidates=[(cx,cy)]+[(min(xs)+(max(xs)-min(xs))*i/20,min(ys)+(max(ys)-min(ys))*j/20) for i in range(1,20) for j in range(1,20)]
    valid=[p for p in candidates if inside(p,ring) and not any(inside(p,hole) for hole in poly[1:]) and in_geometry(p, region_geometry)]
    assert valid, 'No interior representative point'
    return min(valid,key=lambda p:(p[0]-cx)**2+(p[1]-cy)**2)

def path(g):
    chunks=[]
    for poly in polygons(g):
        for ring in poly:
            points=[project(p) for p in ring]
            # Drop subpixel adjacent vertices only; maintain all polygon islands/holes.
            kept=[points[0]]
            for p in points[1:]:
                if math.dist(p,kept[-1])>=.8: kept.append(p)
            if len(kept)>2: chunks.append('M'+'L'.join(f'{x},{y}' for x,y in kept)+'Z')
    return ''.join(chunks)

assert len(NAMES)==len(counties)==147
output={'width':800,'height':640,'landPath':path(national_background),'regions':[],'places':[]}
for f in regions:
    code=f['properties']['shapeISO']
    pts=[project(p) for poly in polygons(f['geometry']) for ring in poly for p in ring]
    xs,ys=zip(*pts)
    output['regions'].append({'id':code,'name':REGION_NAMES[code],'path':path(f['geometry']),'bounds':[min(xs),min(ys),max(xs),max(ys)]})
for i,f in enumerate(counties):
    code='SA-'+next(code for start,end,code in RANGES if start<=i<=end)
    regional_geometry=next(region['geometry'] for region in regions if region['properties']['shapeISO']==code)
    lon,lat=representative(f['geometry'], regional_geometry)
    # The Ahsa marker refers to its cultivated oasis, not the vast Empty Quarter.
    if i==2: lon,lat=49.59,25.38
    output['places'].append({'id':f['properties']['shapeID'],'key':f['properties']['shapeName'],'name':NAMES[i],'region':code,'capital':i in CAPITALS,'point':project([lon,lat]),'locationKind':'oasis' if i==2 else 'representative'})

# Supplement missing ADM2 entries using approximate administrative-seat locations.
# Their markers do not imply new surveyed boundaries or an agricultural site.
supplements=[
    ('Dammam','الدمام','04',50.1033,26.4344,True),
    ('Al Bayda','البيضاء','04',49.969639,26.361361,False),
    ('Al Muwayh','المويه','02',41.75829,22.43333,False),
    ('Al Amwah','الأمواه','14',43.65635,18.71429,False),
    ('Abanat','أبانات','05',42.8533,25.505,False),
]
for key,name,region,lon,lat,capital in supplements:
    output['places'].append({'id':'supplement-'+key.lower().replace(' ','-'),'key':key,'name':name,'region':'SA-'+region,'capital':capital,'point':project([lon,lat]),'locationKind':'approximate-seat'})
for place in output['places']:
    # Every base representative lies in its county and dissolved region.
    # A supplemental seat may fill a gap in the 2021 county coverage.
    x,y=place['point']
    geographic=[34.4+(x-28)/(math.cos(math.radians(24))*36),32.3-(y-28)/36]
    regional_geometry=next(region['geometry'] for region in regions if region['properties']['shapeISO']==place['region'])
    in_region=in_geometry(geographic,regional_geometry)
    gap_supplement=place['locationKind']=='approximate-seat' and not county_union.covers(Point(geographic)) and in_geometry(geographic,old_regions[place['region']])
    assert in_region or gap_supplement, f'Point outside displayed region: {place["key"]}'
target=ROOT/'src/data/saudi-geography.json'
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
(ROOT/'public/data/saudi-geography.json').write_bytes(target.read_bytes())
print(f'{len(output["regions"])} regions, {len(output["places"])} places; {target.stat().st_size} bytes')
