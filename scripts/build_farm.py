"""Deterministic Blender farm asset. Run with Blender --background --python this_file."""
import bpy
import math
import random
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
random.seed(28)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# All construction coordinates use web/Three.js Y-up; glTF maps Blender Z-up.
def xyz(p):
    return (p[0], -p[2], p[1])

GROUPS = ['TerrainSurface', 'Soil', 'BuriedPipes', 'SurfacePipes', 'Plants', 'Infrastructure']
groups = {}
for name in GROUPS:
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    groups[name] = obj

def material(name, rgb, roughness=.78, metallic=0, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*rgb, 1)
        bsdf.inputs['Emission Strength'].default_value = emission
    return m

mats = {
    'earth': material('Loam · warm dark earth', (.21,.135,.079)),
    'clay': material('Clay · ochre stratum', (.35,.245,.145)),
    'sand': material('Sandstone · lower stratum', (.51,.39,.245)),
    'turf': material('Meadow · sage', (.35,.40,.22)),
    'bed': material('Cultivated soil', (.26,.20,.12)),
    'path': material('Limestone gravel', (.69,.65,.52)),
    'stone': material('Pale concrete', (.70,.72,.67)),
    'pipe': material('HDPE · graphite', (.025,.04,.045),.38),
    'blue': material('Water line · blue', (.025,.37,.68),.3,.25,.08),
    'metal': material('Galvanized steel', (.45,.51,.50),.32,.65),
    'navy': material('Masar navy', (.025,.075,.12),.42,.18),
    'white': material('Tank · chalk', (.80,.85,.79),.5),
    'wood': material('Weathered cedar', (.38,.30,.18)),
    'green': material('Leaf · olive', (.22,.34,.09)),
    'lightgreen': material('Leaf · young', (.41,.52,.16)),
    'deepgreen': material('Leaf · shadow', (.10,.22,.085)),
    'fruit': material('Citrus fruit', (.94,.50,.07)),
    'glass': material('Greenhouse · sea glass', (.35,.59,.56),.27,.15),
}
buffers = {}
def face_mesh(group, mat, verts, faces, smooth=False):
    key = (group, mat, smooth)
    v, f = buffers.setdefault(key, ([], []))
    offset = len(v)
    v.extend(xyz(p) for p in verts)
    f.extend(tuple(i+offset for i in face) for face in faces)

def box(group, mat, pos, size):
    x,y,z=pos; a,b,c=[v/2 for v in size]
    pts=[(x+u*a,y+v*b,z+w*c) for u,v,w in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]]
    face_mesh(group,mat,pts,[(1,2,3,0),(7,6,5,4),(4,5,1,0),(5,6,2,1),(6,7,3,2),(7,4,0,3)])

def cylinder(group, mat, a, b, radius, sides=12, radius2=None):
    a,b=Vector(a),Vector(b)
    d=(b-a).normalized()
    u=d.cross(Vector((0,1,0)) if abs(d.y)<.9 else Vector((1,0,0))).normalized()
    v=d.cross(u)
    r2=radius if radius2 is None else radius2
    pts=[tuple(p+r*(u*math.cos(i*math.tau/sides)+v*math.sin(i*math.tau/sides))) for p,r in [(a,radius),(b,r2)] for i in range(sides)]
    faces=[tuple(reversed(range(sides))),tuple(range(sides,sides*2))]
    faces += [(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
    face_mesh(group,mat,pts,faces,True)

def leaf(center, direction, length, width, mat='green'):
    p=Vector(center); d=Vector(direction).normalized(); up=Vector((0,1,0))
    side=d.cross(up)
    if side.length<.01: side=Vector((1,0,0))
    side.normalize()
    pts=[p,p+d*length*.43+side*width,p+d*length,p+d*length*.43-side*width,p+d*length*.44+up*width*.48]
    face_mesh('Plants',mat,[tuple(v) for v in pts],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)])

def bevel_box(name,group,mat,pos,size,radius=.15):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(pos))
    obj=bpy.context.object; obj.name=name
    obj.dimensions=(size[0],size[2],size[1]); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=obj.modifiers.new('Soft manufactured edges','BEVEL');mod.width=radius;mod.segments=3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mats[mat]);obj.parent=groups[group]
    return obj

# Floating cut-earth plinth, crisp readable stratigraphy.
bevel_box('Deep sandstone', 'Soil','sand',(0,-2.05,0),(24,.70,18),.24)
bevel_box('Clay layer','Soil','clay',(0,-1.41,0),(24,.62,18),.16)
bevel_box('Topsoil','Soil','earth',(0,-.61,0),(24,.98,18),.14)
bevel_box('Thin turf cover','TerrainSurface','turf',(0,-.045,0),(24,.15,18),.15)
# Exposed stone fragments on the cut edges.
for i in range(140):
    x=random.uniform(-11.8,11.8); y=random.uniform(-2.15,-.25)
    z=8.998 if i%2 else -8.998
    box('Soil','sand',(x,y,z),(random.uniform(.04,.18),random.uniform(.025,.08),.016))

# Quiet pale paths frame the productive plots.
box('TerrainSurface','path',(-8,.018,0),(1.1,.055,17.5))
box('TerrainSurface','path',(1,.02,4),(20.6,.055,.9))
box('TerrainSurface','path',(1,.02,-3),(20.6,.055,.9))
box('TerrainSurface','path',(-.1,.024,.6),(.75,.055,6))
box('TerrainSurface','path',(10.35,.026,0),(.7,.055,16.9))

# Black PE trunk and branches. Blue thin crown stripe makes their purpose legible.
def pipe(a,b,group='SurfacePipes',r=.16):
    cylinder(group,'pipe',a,b,r,16)
    a1=list(a);b1=list(b);a1[1]+=r*.95;b1[1]+=r*.95
    cylinder(group,'blue',a1,b1,.024,6)

pipe((-8,.4,7),(-8,.4,-6),r=.19)
pipe((-8,.4,-3),(-1,.4,-3))
pipe((-8,.4,-3),(-8,-1.05,-3),'BuriedPipes')
pipe((-8,-1.05,-3),(9,-1.05,-3),'BuriedPipes')
pipe((9,-1.05,-3),(9,.38,-3),'BuriedPipes')
pipe((-8,.4,4),(9,.4,4))
for z in [-6,-3,0,4,6.8]:
    cylinder('SurfacePipes','blue',(-8,.4,z-.10),(-8,.4,z+.10),.225,16)
for z,xs in [(-3,[-7,-3,-1]),(4,[-7,-3,1,6,8.8])]:
    for x in xs:
        cylinder('SurfacePipes','blue',(x-.10,.4,z),(x+.10,.4,z),.195,16)
        box('Infrastructure','stone',(x,.095,z),(.42,.19,.48))
for x in [0,2,6,8.8]:
    cylinder('BuriedPipes','blue',(x-.08,-1.05,-3),(x+.08,-1.05,-3),.20,16)

# Three clearly different planted areas with dirt ridges and drip laterals.
for xmin,xmax,zmin,zmax,kind in [(-6.8,-.8,-1.95,2.9,'lettuce'),(.65,9.25,-1.95,2.9,'corn'),(-6.8,9.25,5.1,7.85,'herbs')]:
    box('TerrainSurface','bed',((xmin+xmax)/2,.025,(zmin+zmax)/2),(xmax-xmin,.085,zmax-zmin))
    rows=6 if kind!='herbs' else 12
    for row in range(rows):
        x=xmin+.40+row*(xmax-xmin-.8)/(rows-1)
        box('TerrainSurface','earth',(x,.09,(zmin+zmax)/2),(.37,.14,zmax-zmin-.2))
        cylinder('SurfacePipes','pipe',(x+.20,.15,zmin),(x+.20,.15,zmax),.023,6)
        count=7 if kind!='herbs' else 4
        for j in range(count):
            z=zmin+.35+j*(zmax-zmin-.7)/(count-1)
            p=(x+random.uniform(-.06,.06),.13,z+random.uniform(-.07,.07))
            if kind=='corn':
                h=random.uniform(.65,.93)
                cylinder('Plants','green',p,(p[0],h,p[2]),.025,5)
                for k in range(7):
                    a=k*2.4+row
                    leaf((p[0],.24+k*.075,p[2]),(math.cos(a),.40,math.sin(a)),.48,.12,'lightgreen' if k%3 else 'green')
                cylinder('Plants','lightgreen',(x,h-.10,z),(x+.035,h+.16,z),.026,5)
            else:
                for k in range(9 if kind=='lettuce' else 6):
                    a=k*2.399+row
                    leaf(p,(math.cos(a),.35+(k%3)*.3,math.sin(a)),.43 if kind=='lettuce' else .33,.17 if kind=='lettuce' else .085,'lightgreen' if k%3 else 'green')

# Orchard: actual branching stems and hundreds of tapered leaves, no spherical crowns.
for x in [-5.8,-2.8,.2]:
    for z in [-7.25,-5.2]:
        box('TerrainSurface','bed',(x,.02,z),(1.5,.045,1.5))
        cylinder('Plants','wood',(x,0,z),(x,1.50,z),.12,9,.055)
        for b in range(7):
            angle=b*2.4; tip=Vector((x+math.cos(angle)*.68,1.45+random.uniform(.1,.65),z+math.sin(angle)*.65))
            cylinder('Plants','wood',(x,.75,z),tuple(tip),.045,6,.013)
            for k in range(24):
                a=random.uniform(0,math.tau)
                center=tip+Vector((random.uniform(-.32,.32),random.uniform(-.28,.28),random.uniform(-.30,.30)))
                leaf(tuple(center),(math.cos(a),random.uniform(-.15,.7),math.sin(a)),random.uniform(.24,.42),.10,['green','lightgreen','deepgreen'][k%3])
        for k in range(5):
            a=k*1.7
            cylinder('Plants','fruit',(x+math.cos(a)*.53,1.40,z+math.sin(a)*.54),(x+math.cos(a)*.53,1.54,z+math.sin(a)*.54),.075,8,.05)

# Greenhouse, solid tinted panels for predictable real-time rendering.
gx,gz=6.2,-6.5
box('Infrastructure','stone',(gx,.08,gz),(5.1,.16,3.9))
box('Infrastructure','glass',(gx,1.0,gz),(4.8,1.7,3.6))
# Pitched roof with explicit triangles.
roof=[(gx-2.4,1.85,gz-1.8),(gx+2.4,1.85,gz-1.8),(gx+2.4,1.85,gz+1.8),(gx-2.4,1.85,gz+1.8),(gx-2.4,2.75,gz),(gx+2.4,2.75,gz)]
face_mesh('Infrastructure','glass',roof,[(4,5,1,0),(3,2,5,4),(3,4,0),(5,2,1)])
for x in [gx-2.4,gx-1.2,gx,gx+1.2,gx+2.4]:
    for z in [gz-1.8,gz+1.8]:
        cylinder('Infrastructure','white',(x,.1,z),(x,1.85,z),.04,6)
        cylinder('Infrastructure','white',(x,1.85,z),(x,2.75,gz),.045,6)
for y in [.2,1.05,1.85]:
    for z in [gz-1.8,gz+1.8]: cylinder('Infrastructure','white',(gx-2.4,y,z),(gx+2.4,y,z),.035,6)
cylinder('Infrastructure','white',(gx-2.4,2.75,gz),(gx+2.4,2.75,gz),.05,6)
box('Infrastructure','navy',(gx+2.42,.87,gz),(.035,1.55,.88))
box('Infrastructure','white',(gx+2.45,.84,gz-.3),(.06,.08,.08))

# Tank, ribbing, pump and compact service shed on the west edge.
box('Infrastructure','stone',(-10,.08,-5.8),(2.5,.16,3))
cylinder('Infrastructure','white',(-10,.18,-5.8),(-10,2.6,-5.8),.9,32)
for y in [.35,.75,1.15,1.55,1.95,2.35]:
    cylinder('Infrastructure','white',(-10,y,-5.8),(-10,y+.055,-5.8),.943,32)
cylinder('Infrastructure','navy',(-10,2.60,-5.8),(-10,2.72,-5.8),.32,20)
pipe((-10,.4,-5.8),(-8,.4,-5.8))
bevel_box('Pump motor','Infrastructure','blue',(-9,.52,-4.45),(.8,.64,.5),.09)
cylinder('Infrastructure','metal',(-9,.52,-4.8),(-9,.52,-4.1),.19,12)
box('Infrastructure','stone',(-9,.12,-4.45),(1.2,.22,1))
pipe((-9,.45,-4.8),(-9,.45,-5.8),r=.10)
pipe((-9,.45,-4.1),(-8,.45,-4.1),r=.10)
bevel_box('Control shed','Infrastructure','white',(-10,.75,-.5),(2.3,1.5,2.8),.06)
bevel_box('Shed roof','Infrastructure','navy',(-10,1.58,-.5),(2.55,.17,3.05),.04)
box('Infrastructure','navy',(-8.83,.64,-.5),(.045,1.22,.65))
box('Infrastructure','blue',(-8.79,1.14,.27),(.07,.44,.45))
# Roof solar panels with real cell lines.
box('Infrastructure','blue',(-10,1.69,-.5),(1.75,.055,2.25))
for xx in [-10.86,-10.43,-10,-9.57,-9.14]:box('Infrastructure','metal',(xx,1.725,-.5),(.012,.013,2.25))
for zz in [-1.625,-1.06,-.5,.06,.625]:box('Infrastructure','metal',(-10,1.725,zz),(1.75,.013,.012))

# Farm boundary, open at the front central access.
for z in [-8.5,8.5]:
    for i in range(16):
        x=-11.3+i*1.5
        if z>0 and -2<x<2:continue
        box('Infrastructure','wood',(x,.47,z),(.10,.94,.10))
        if i<15 and not (z>0 and -3<x<2):
            for y in [.35,.7]:box('Infrastructure','wood',(x+.75,y,z),(1.5,.055,.055))
for x in [-11.4,11.4]:
    for i in range(12):
        z=-8.25+i*1.5
        box('Infrastructure','wood',(x,.47,z),(.1,.94,.1))
        if i<11:
            for y in [.35,.7]:box('Infrastructure','wood',(x,y,z+.75),(.055,.055,1.5))

# Merge by material and semantic layer: a few dozen draw calls, no textures needed.
for (group,mat,smooth),(verts,faces) in buffers.items():
    mesh=bpy.data.meshes.new(group+'_'+mat)
    mesh.from_pydata(verts,[],faces);mesh.materials.append(mats[mat]);mesh.update()
    obj=bpy.data.objects.new(group+'_'+mat,mesh);bpy.context.collection.objects.link(obj);obj.parent=groups[group]
    if smooth:
        for p in mesh.polygons:p.use_smooth=True

scene=bpy.context.scene
scene.world.color=(.24,.28,.33)
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.67,.74,.80,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
bpy.ops.object.light_add(type='AREA',location=(3,-8,22))
light=bpy.context.object;light.name='Preview softbox';light.data.energy=3200;light.data.shape='DISK';light.data.size=15
bpy.ops.object.light_add(type='SUN',location=(8,-12,18))
sun=bpy.context.object;sun.rotation_euler=(.35,-.45,-.45);sun.data.energy=2.0;sun.data.angle=.25
bpy.ops.object.camera_add(location=xyz((27,27,33)))
camera=bpy.context.object;camera.rotation_euler=(Vector(xyz((0,.1,0)))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=35;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=750;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'

# Selection excludes preview-only cameras/lights from web asset.
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type in {'MESH','EMPTY'}:obj.select_set(True)
glb=ROOT/'public/models/masar-farm.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False,export_materials='EXPORT')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/masar-farm.blend'))
points=[o.matrix_world @ Vector(v) for o in bpy.data.objects if o.type=='MESH' for v in o.bound_box]
web_points=[(p.x,p.z,-p.y) for p in points]
bounds={name:[round(fn(p[i] for p in web_points),4) for i in range(3)] for name,fn in [('min',min),('max',max)]}
report={'groups':GROUPS,'glb_bytes':glb.stat().st_size,'mesh_objects':sum(o.type=='MESH' for o in bpy.data.objects),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.data.objects if o.type=='MESH'),'web_bounds':bounds,'leaks':{'A':[-5,.4,-3],'B':[4,-1.05,-3],'C':[4,.4,4]}}
(ROOT/'docs/reference/farm-metadata.json').write_text(json.dumps(report,indent=2))
assert glb.stat().st_size<8*1024*1024,'Farm GLB exceeds budget'
print('FARM_ASSET_REPORT '+json.dumps(report),flush=True)
scene.render.filepath=str(ROOT/'docs/reference/farm-preview.png')
bpy.ops.render.render(write_still=True)
