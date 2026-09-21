"""Build Masar's reference-based presentation model in Blender 4.5.

Run: blender --background --python scripts/build_device.py
The model interprets the supplied concept imagery, not engineering CAD.
"""
from pathlib import Path
from datetime import datetime, timezone
import json
import math
import sys
import bpy
from mathutils import Euler, Vector

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / 'public/models/masar-device.glb'
BLEND = ROOT / 'assets/blender/masar-device.blend'
RENDER = ROOT / 'public/images/device-render.png'
VERIFICATION = ROOT / 'docs/reference/device-layout-verification.json'
for output in (MODEL, BLEND, RENDER):
    output.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


def material(name, color, metal=0.0, roughness=0.35, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = emission
    return mat


steel = material('Polished stainless steel', (0.65, 0.71, 0.76), 0.94, 0.2)
brushed = material('Brushed steel union nuts', (0.48, 0.54, 0.59), 0.9, 0.31)
inner = material('Machined dark steel', (0.20, 0.25, 0.29), 0.86, 0.3)
blue = material('Reference blue enamel', (0.003, 0.053, 0.22), 0.12, 0.29)
rubber = material('Black elastomer seals', (0.009, 0.013, 0.017), 0, 0.65)
screen = material('Black display lens', (0.004, 0.005, 0.007), 0.15, 0.22)
red = material('Red seven segment LED', (1.0, 0.003, 0.001), 0.05, 0.24, 1.5)
green = material('Green PCB solder mask', (0.008, 0.105, 0.056), 0.15, 0.36)
gold = material('Gold plated contacts', (0.71, 0.48, 0.12), 0.82, 0.3)
chip = material('IC packages', (0.016, 0.021, 0.025), 0.1, 0.6)
silver = material('Battery aluminium pouch', (0.56, 0.59, 0.59), 0.78, 0.3)
yellow = material('Battery amber foil tape', (0.91, 0.54, 0.025), 0.34, 0.3)
white = material('Turbine ivory polymer', (0.76, 0.76, 0.65), 0.05, 0.4)
ink = material('PCB silkscreen', (0.67, 0.77, 0.67), 0, 0.6)
wire_red = material('Positive lead insulation', (0.48, 0.009, 0.005), 0, 0.4)

groups = {}
directions = {
    'Housing': [0, 0, 0], 'Turbine': [0, 1.4, .2],
    'Sensor': [0, 2, .35], 'Battery': [0, 2.8, .5],
    'Wireless': [0, 3.3, .6], 'PCB': [0, 4.6, .7],
    'Seal': [0, 5.5, .8], 'Display': [0, 6.4, .9],
}
for name, vector in directions.items():
    group = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(group)
    group['explode'] = vector
    group['part'] = name
    group['coordinate_system'] = 'explode uses glTF / Three.js XYZ'
    groups[name] = group


def finish(obj, name, mat, group, bevel=0.0, smooth=True):
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = groups[group]
    if bevel:
        mod = obj.modifiers.new('Machined edge fillet', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    if smooth:
        for poly in obj.data.polygons:
            poly.use_smooth = True
        mod = obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
        mod.weight = 40
    return obj


def box(name, loc, size, mat, group, bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, group, bevel)


def cylinder(name, loc, radius, depth, mat, group, axis='Y', vertices=64, bevel=.015):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.rotation_euler = (math.pi / 2, 0, 0) if axis == 'Y' else (0, math.pi / 2, 0) if axis == 'X' else (0, 0, 0)
    return finish(obj, name, mat, group, bevel)


def ring(name, loc, outer, inside, depth, mat, group, axis='Y', segments=64, bevel=.015):
    verts = []
    for radius, offset in ((outer, -depth/2), (outer, depth/2), (inside, -depth/2), (inside, depth/2)):
        for i in range(segments):
            angle = 2 * math.pi * i / segments
            a, b = radius * math.cos(angle), radius * math.sin(angle)
            p = (a, offset, b) if axis == 'Y' else (offset, a, b)
            verts.append(tuple(p[j] + loc[j] for j in range(3)))
    faces = []
    for i in range(segments):
        j = (i + 1) % segments
        faces.extend(((i, j, segments+j, segments+i),
                      (2*segments+j, 2*segments+i, 3*segments+i, 3*segments+j),
                      (j, i, 2*segments+i, 2*segments+j),
                      (segments+i, segments+j, 3*segments+j, 3*segments+i)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat, group, bevel, segments > 8)


def torus(name, loc, radius, minor, mat, group, axis='Y'):
    bpy.ops.mesh.primitive_torus_add(major_segments=64, minor_segments=10,
                                  location=loc, major_radius=radius, minor_radius=minor)
    obj = bpy.context.object
    obj.rotation_euler = (math.pi / 2, 0, 0) if axis == 'Y' else (0, math.pi / 2, 0)
    return finish(obj, name, mat, group)


def wire(name, points, mat, group, radius=.018):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for point, co in zip(spline.bezier_points, points):
        point.co = co
        point.handle_left_type = 'AUTO'
        point.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = groups[group]
    return obj


# Main pressure body: hollow cup and genuine open bores in the two pipe ends.
cylinder('Rear pressure cup', (0, 1.115, 0), 1.45, .16, brushed, 'Housing')
ring('Cylindrical steel housing', (0, .265, 0), 1.46, 1.32, 1.65, steel, 'Housing', bevel=.045)
ring('Front sealing flange', (0, -.61, 0), 1.53, 1.31, .13, steel, 'Housing', bevel=.028)
ring('Housing shoulder', (0, 1.025, 0), 1.48, 1.38, .16, brushed, 'Housing', bevel=.028)
for side, label in ((-1, 'Inlet'), (1, 'Outlet')):
    ring(label+' neck', (side*1.74, .08, -.25), .48, .32, .72, steel, 'Housing', axis='X', bevel=.035)
    ring(label+' union nut', (side*2.38, .08, -.25), .67, .35, .7, brushed, 'Housing', axis='X', segments=6, bevel=.07)
    ring(label+' end collar', (side*2.79, .08, -.25), .49, .34, .15, steel, 'Housing', axis='X', bevel=.026)
    ring(label+' dark bore', (side*2.61, .08, -.25), .35, .295, .2, inner, 'Housing', axis='X', bevel=.006)
    for i in range(7):
        ring(label+f' thread {i+1}', (side*(1.79 + i*.062), .08, -.25), .49, .43, .027, steel, 'Housing', axis='X', bevel=.009)
    torus(label+' compression seal', (side*2.00, .08, -.25), .458, .028, rubber, 'Housing', axis='X')

# Ivory impeller and magnetic pickup, visible when the housing is opened.
cylinder('Impeller bearing seat', (0, .31, -.25), .6, .12, inner, 'Turbine')
cylinder('Ivory turbine hub', (0, .16, -.25), .19, .2, white, 'Turbine')
cylinder('Turbine axle', (0, .0, -.25), .069, .3, steel, 'Turbine')
for i in range(8):
    angle = i * math.pi / 4
    blade = box(f'Impeller curved vane {i+1}', (.32*math.sin(angle), .16, -.25+.32*math.cos(angle)), (.13, .18, .5), white, 'Turbine', .035)
    blade.rotation_euler[1] = angle + .26
box('Magnetic pickup', (0, .01, .38), (.36, .28, .3), chip, 'Turbine', .06)
cylinder('Magnetic pickup cap', (0, -.16, .38), .11, .08, rubber, 'Turbine')

# Small pressure sensor PCB with a metal pressure element and discrete passives.
box('Pressure sensor PCB', (0, -.08, .10), (.86, .065, .35), green, 'Sensor', .025)
ring('Pressure sensor steel can', (0, -.23, .10), .13, .077, .25, steel, 'Sensor', segments=32)
for x in (-.3, .26):
    box('Sensor conditioning IC', (x, -.135, .10), (.13, .05, .16), chip, 'Sensor', .009)
    for z in (-.04, .24):
        box('Sensor solder pad', (x, -.122, z), (.09, .023, .055), gold, 'Sensor', .004)

# Lithium pouch cell, folded amber terminal foil and two leads.
box('Lithium polymer silver pouch', (0, -.24, -.22), (1.02, .19, .62), silver, 'Battery', .04)
box('Battery pouch seam', (0, -.345, -.22), (1.05, .022, .66), silver, 'Battery', .012)
box('Amber terminal tape', (-.48, -.25, -.22), (.24, .205, .64), yellow, 'Battery', .026)
box('Battery protection tab', (-.58, -.25, -.22), (.09, .13, .36), gold, 'Battery', .013)
wire('Battery positive lead', [(-.58,-.28,-.12),(-.8,-.28,-.02),(-.84,-.25,-.4),(-.51,-.25,-.53)], wire_red, 'Battery')
wire('Battery negative lead', [(-.57,-.23,-.3),(-.76,-.22,-.38),(-.72,-.22,-.55),(-.43,-.22,-.57)], rubber, 'Battery')

# Wireless module: green board, shield, castellated contacts and printed antenna.
box('Wireless module board', (0, -.39, .42), (.9, .05, .48), green, 'Wireless', .02)
box('RF shield can', (.16, -.44, .42), (.48, .065, .35), silver, 'Wireless', .016)
box('RF antenna zone', (-.30, -.425, .42), (.2, .016, .41), chip, 'Wireless', .005)
for z in (.25,.34,.43,.52,.60):
    box('Antenna copper trace', (-.30, -.443, z), (.16, .008, .012), gold, 'Wireless', .001)
for i in range(9):
    for z in (.2,.64):
        box('Wireless castellated pad', (-.36+i*.09,-.428,z), (.045,.022,.06), gold, 'Wireless', .002)

# Main round control PCB: visible copper routing, chips, passives and screw holes.
cylinder('Round main control PCB', (0, -.53, 0), 1.19, .07, green, 'PCB', bevel=.018)
box('Main microcontroller', (0, -.60, -.1), (.45,.075,.45), chip, 'PCB', .022)
for i in range(9):
    for sign in (-1, 1):
        box('Controller solder pin', (sign*.265,-.585,-.30+i*.05), (.09,.025,.022), silver, 'PCB', .003)
        box('Controller solder pin', (-.20+i*.05,-.585,-.1+sign*.265), (.022,.025,.09), silver, 'PCB', .003)
for i, (x,z) in enumerate(((-.7,-.5),(.7,-.45),(-.62,.36),(.58,.48),(-.4,.78),(.44,-.8))):
    box(f'PCB IC {i}', (x,-.594,z), (.24,.06,.16), chip, 'PCB', .009)
    for offset in (-.075,0,.075):
        box('PCB solder contact', (x+offset,-.585,z+.12), (.045,.023,.045), gold, 'PCB', .002)
    for j in range(3):
        box('PCB passive capacitor', (x-.09+j*.09,-.601,z-.15), (.052,.04,.06), silver, 'PCB', .005)
for i in range(16):
    angle = i*math.tau/16
    x,z = .98*math.cos(angle), .98*math.sin(angle)
    ring('PCB plated via', (x,-.579,z), .033,.016,.012,gold,'PCB',segments=12,bevel=.002)
    wire('PCB copper routing', [(x,-.574,z),(x*.78,-.574,z*.78),(x*.78+.08,-.574,z*.65)], gold,'PCB', .004)
for angle in (math.pi/4,3*math.pi/4,5*math.pi/4,7*math.pi/4):
    x,z = 1.05*math.cos(angle),1.05*math.sin(angle)
    ring('PCB mounting eyelet',(x,-.588,z),.064,.035,.018,gold,'PCB',segments=20,bevel=.005)

torus('Main circular rubber gasket', (0,-.705,0),1.325,.04,rubber,'Seal')
ring('Display inner gasket', (0,-.724,0),1.375,1.315,.035,rubber,'Seal',bevel=.008)

# Front cover repeats the reference's concentric steel lip and blue circular face.
ring('Polished front bezel', (0,-.815,0),1.53,1.355,.21,steel,'Display',bevel=.048)
torus('Outer bright rolled lip',(0,-.925,0),1.455,.055,steel,'Display')
torus('Inner steel retaining ring',(0,-.932,0),1.341,.029,brushed,'Display')
cylinder('Blue enamel front plate',(0,-.858,0),1.334,.135,blue,'Display',bevel=.035)
box('Vertical display steel surround',(0,-.963,0),(.73,.075,2.12),inner,'Display',.085)
box('Vertical black display',(0,-1.008,0),(.626,.043,2.005),screen,'Display',.055)

# Geometry-based seven segment digits; no texture or web font dependency.
# Digit layout is rotated 90 degrees, reading 33.96 from bottom to top as supplied.
segments = {
    'a': (0,.147,.205,.034), 'b': (.111,.077,.033,.118),
    'c': (.111,-.077,.033,.118), 'd': (0,-.147,.205,.034),
    'e': (-.111,-.077,.033,.118), 'f': (-.111,.077,.033,.118),
    'g': (0,0,.205,.032),
}
active = {'3':'abcdg','9':'abcdfg','6':'acdefg'}
for i, digit in enumerate('3396'):
    position = -.70 + i*.455
    for segment in active[digit]:
        u,v,w,h = segments[segment]
        box(f'LED digit {i+1} segment {segment}',(-v,-1.038,position+u),(h,.018,w),red,'Display',.009)
cylinder('LED decimal point',(.205,-1.042,-.02),.022,.019,red,'Display',vertices=16,bevel=.003)

# Convert curves before export so every mechanical part is present in glTF.
for obj in list(bpy.context.scene.objects):
    if obj.type == 'CURVE':
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')


def group_vertices(group):
    """Evaluated world vertices include bevels and curved wire geometry."""
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in group.children:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        points.extend(evaluated.matrix_world @ vertex.co for vertex in mesh.vertices)
        evaluated.to_mesh_clear()
    return points


def bounds(points):
    return {
        'min': [min(point[axis] for point in points) for axis in range(3)],
        'max': [max(point[axis] for point in points) for axis in range(3)],
    }


def gltf_vector(point):
    return Vector((point[0], point[2], -point[1]))


# Place complete electronic assemblies in separate depth slabs. Their original
# component relationships are retained, and actual evaluated geometry drives
# the offsets instead of hand-estimated dimensions.
depth_order = ['PCB', 'Wireless', 'Battery', 'Sensor', 'Turbine']
depth_gap = .065
previous_back = None
assembled_checks = []
for name in depth_order:
    group = groups[name]
    part_bounds = bounds(group_vertices(group))
    if previous_back is not None:
        group.location.y += previous_back + depth_gap - part_bounds['min'][1]
        part_bounds = bounds(group_vertices(group))
        gap = part_bounds['min'][1] - previous_back
        assert gap >= depth_gap - 1e-5, f'{name} overlaps the preceding depth slab'
        assembled_checks.append({'part': name, 'depth_gap': gap, 'passed': True})
    previous_back = part_bounds['max'][1]
    vertices = group_vertices(group)
    radial_extent = max(math.hypot(point.x, point.z) for point in vertices)
    assert radial_extent < 1.30, f'{name} intersects the cylindrical housing wall'
    assert part_bounds['min'][1] > -.67 and part_bounds['max'][1] < 1.035, f'{name} outside cavity'
    assembled_checks.append({'part': name, 'radial_extent': radial_extent, 'inside_cavity': True})

# Rebase roots to their own bounding centres, preserving every assembled world
# transform. glTF roots can now rotate about their own centroid without orbiting.
assembled_points = {}
for name, group in groups.items():
    points = group_vertices(group)
    part_bounds = bounds(points)
    center = Vector([(part_bounds['min'][i] + part_bounds['max'][i]) / 2 for i in range(3)])
    transforms = [(obj, obj.matrix_world.copy()) for obj in group.children]
    group.location = center
    bpy.context.view_layer.update()
    for obj, world_transform in transforms:
        obj.matrix_basis = group.matrix_world.inverted() @ world_transform
    group['assembledOrigin'] = list(gltf_vector(center))
    group['pivot'] = [0.0, 0.0, 0.0]
    assembled_points[name] = [gltf_vector(point) for point in points]
    group['assembledBounds'] = bounds(assembled_points[name])

# Turn the cavity opening upward and stack every assembly on its centreline.
# Rotate the housing too; leaving it front-facing makes parts exit its side.
exploded_gap = .34
exploded_checks = []
layout_parts = {}
previous_top = None
previous_name = None
previous_visual_top = None
view_direction = Vector((.10, .52, 1.0)).normalized()
view_right = Vector((0, 1, 0)).cross(view_direction).normalized()
view_up = view_direction.cross(view_right).normalized()
for name, group in groups.items():
    origin = Vector(group['assembledOrigin'])
    rotation = [-math.pi / 2, 0.0, 0.0]
    matrix = Euler(rotation, 'XYZ').to_matrix()
    rotated = [matrix @ (point - origin) for point in assembled_points[name]]
    rotated_bounds = bounds(rotated)
    target = origin.copy()
    if previous_top is not None:
        target = Vector((0, previous_top + exploded_gap - rotated_bounds['min'][1], groups['Housing']['assembledOrigin'][2]))
        # Wide horizontal discs also need clearance in the elevated camera view.
        # Physical gaps alone can make the lid hide the seal and circuit board.
        visual_bottom = min(view_up.dot(point) for point in rotated)
        visual_y = (previous_visual_top + .42 - visual_bottom - view_up.z * target.z) / view_up.y
        target.y = max(target.y, visual_y)
    exploded = [point + target for point in rotated]
    exploded_bounds = bounds(exploded)
    if previous_top is not None:
        actual_gap = exploded_bounds['min'][1] - previous_top
        assert actual_gap >= .25, f'{name} overlaps {previous_name} after explosion'
        exploded_checks.append({'lower': previous_name, 'upper': name, 'gap': actual_gap, 'passed': True})
    group['explode'] = list(target - origin)
    group['explodeRotation'] = rotation
    group['explodedOrigin'] = list(target)
    group['explodedBounds'] = exploded_bounds
    group['layoutVersion'] = 2
    layout_parts[name] = {key: group[key].to_dict() if hasattr(group[key], 'to_dict') else list(group[key])
                         for key in ('assembledOrigin', 'pivot', 'explode', 'explodeRotation',
                                     'explodedOrigin', 'assembledBounds', 'explodedBounds')}
    previous_top = exploded_bounds['max'][1]
    previous_visual_top = max(view_up.dot(point) for point in exploded)
    previous_name = name

VERIFICATION.parent.mkdir(parents=True, exist_ok=True)
VERIFICATION.write_text(json.dumps({
    'verifiedAt': datetime.now(timezone.utc).isoformat(),
    'blenderVersion': bpy.app.version_string,
    'coordinateSystem': 'glTF XYZ, Y up, front +Z',
    'layoutVersion': 2,
    'method': 'Evaluated mesh vertices including modifiers; no guessed part extents',
    'assembledDepthOrderFrontToBack': depth_order,
    'assembledDepthGapMinimum': depth_gap,
    'explodedVerticalGapMinimum': exploded_gap,
    'assembledChecks': assembled_checks,
    'explodedChecks': exploded_checks,
    'parts': layout_parts,
}, indent=2), encoding='utf-8')

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 40
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.render.filepath = str(RENDER)
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.35,.40,.48,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .6
scene.view_settings.view_transform = 'AgX'


def area(name, loc, power, size, color, target=(0,0,0)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.shape = 'DISK'
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()


area('Large softbox left',(-4,-5,6),1200,5,(.86,.93,1))
area('Front white reflection',(3,-6,1),900,4,(1,1,1))
area('Top rim softbox',(1,2,5),1500,3,(.82,.9,1))
area('Warm lower reflection',(-3,-1,-3),550,3,(1,.92,.82))
camera_data = bpy.data.cameras.new('Product camera')
camera = bpy.data.objects.new('Product camera',camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (3.8,-10,3.1)
camera.rotation_euler = (Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 7.25
scene.camera = camera

# Keep the editable source fully separated. Bake and batch by material only for
# the web export, reducing hundreds of tiny components to a few dozen draw calls.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
for group in groups.values():
    by_material = {}
    for obj in list(group.children):
        if obj.type != 'MESH':
            continue
        key = obj.data.materials[0].name
        by_material.setdefault(key, []).append(obj)
    for key, objects in by_material.items():
        vertices, faces, smooth_faces, normals = [], [], [], []
        bpy.context.view_layer.update()
        depsgraph = bpy.context.evaluated_depsgraph_get()
        for obj in objects:
            evaluated = obj.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            local_matrix = group.matrix_world.inverted() @ evaluated.matrix_world
            normal_matrix = local_matrix.to_3x3().inverted().transposed()
            offset = len(vertices)
            vertices.extend(local_matrix @ vertex.co for vertex in mesh.vertices)
            faces.extend(tuple(offset + index for index in polygon.vertices) for polygon in mesh.polygons)
            smooth_faces.extend(polygon.use_smooth for polygon in mesh.polygons)
            normals.extend((normal_matrix @ normal.vector).normalized() for normal in mesh.corner_normals)
            evaluated.to_mesh_clear()
        mesh = bpy.data.meshes.new(f'{group.name} - {key}')
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        for polygon, smooth in zip(mesh.polygons, smooth_faces):
            polygon.use_smooth = smooth
        mesh.normals_split_custom_set(normals)
        mesh.materials.append(bpy.data.materials[key])
        combined = bpy.data.objects.new(mesh.name, mesh)
        bpy.context.collection.objects.link(combined)
        combined.parent = group
        for obj in objects:
            bpy.data.objects.remove(obj, do_unlink=True)

bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type not in {'CAMERA','LIGHT'}:
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(MODEL), export_format='GLB', use_selection=True,
                          export_apply=True, export_extras=True, export_yup=True,
                          export_cameras=False, export_lights=False)
if '--skip-render' not in sys.argv:
    bpy.ops.render.render(write_still=True)
print(f'MASAR MODEL COMPLETE: {MODEL.stat().st_size:,} bytes, {len(groups)} groups')
