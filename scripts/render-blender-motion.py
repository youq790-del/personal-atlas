"""Render Blender study frames without saving or executing source scripts.

Run with Blender 4.5.3 LTS:
  blender --background --factory-startup --disable-autoexec --python <this-file> --
      grass --source-root <blender-works> --output-root <render-output>

See BLENDER-MOTION.md for provenance, the export plan, and FFmpeg encoding.
"""
import bpy, argparse, json, sys, math, re, time, traceback
from pathlib import Path
from mathutils import Vector, Matrix
FILES={'particles':'70-苹果九月粒子logo/演示文件.blend','grass':'Blender 动漫风草地/grass Do It With Me.blend','liquid':'液态玻璃.blend','cloud':'yun.blend','organic':'练习/有机方块.blend'}
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('slug',choices=FILES)
parser.add_argument('--source-root',type=Path,required=True,help='Directory containing the supplied Blender study files; read-only.')
parser.add_argument('--output-root',type=Path,required=True,help='Separate render output directory; must be outside source-root.')
parser.add_argument('--probe',action='store_true',help='Render three inspection frames instead of the full range.')
parser.add_argument('--eevee',action='store_true',help='Use Eevee for a lightweight web preview; record this change.')
parser.add_argument('--orbit',action='store_true',help='Add a new presentation camera orbit; this is not source timeline motion.')
parser.add_argument('--force',action='store_true',help='Replace existing PNG frames in output-root.')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
slug=args.slug;probe=args.probe;orbit=args.orbit
BASE=args.source_root.expanduser().resolve()
work=args.output_root.expanduser().resolve()
if not BASE.is_dir():parser.error('--source-root must be an existing directory')
if not (BASE/FILES[slug]).is_file():parser.error('The selected Blender source file is missing beneath --source-root')
if work==BASE or BASE in work.parents:parser.error('--output-root must be outside --source-root to keep the originals read-only')
variant='-eevee' if args.eevee else ''
out=work/(slug+variant);out.mkdir(parents=True,exist_ok=True)
status={'slug':slug,'stage':'loading','presentationChanges':[],'sourceUntouched':True}
def log(stage,**kw):
 status.update(stage=stage,**kw);(work/(slug+'-status.json')).write_text(json.dumps(status,ensure_ascii=False,indent=2),encoding='utf-8')
try:
 bpy.ops.wm.open_mainfile(filepath=str(BASE/FILES[slug]),load_ui=True,use_scripts=False)
 s=bpy.context.scene
 status['native']={'engine':s.render.engine,'frames':[s.frame_start,s.frame_end],'fps':s.render.fps/s.render.fps_base,'savedFrame':s.frame_current}
 if slug=='grass' and bpy.data.objects.get('Cube'):
  bpy.data.objects['Cube'].hide_render=True;status['presentationChanges'].append('Hide tutorial cube, as in existing poster.')
 if not s.camera:
  d=bpy.data.cameras.new('Web presentation camera');cam=bpy.data.objects.new('Web presentation camera',d);s.collection.objects.link(cam);s.camera=cam
  views=[a.spaces.active.region_3d for sc in bpy.data.screens for a in sc.areas if a.type=='VIEW_3D' and a.spaces.active.region_3d]
  v=next((v for v in views if v.view_distance>5),views[0] if views else None)
  if v:cam.rotation_mode='QUATERNION';cam.rotation_quaternion=v.view_rotation;cam.location=Vector(v.view_location)+v.view_rotation@Vector((0,0,v.view_distance));cam.data.lens=45
  else:cam.location=(10,-20,9);cam.rotation_euler=(Vector((0,0,2))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=45
  status['presentationChanges'].append('Add camera matching saved viewport; source has no camera.')
 if slug=='organic':
  # Resolve one inspected static cone-height driver to its numeric value.
  # A same-tree RNA variable would create a dependency cycle; frame/110 is unchanged.
  # Never enable source scripts or evaluate an arbitrary expression.
  for tree in bpy.data.node_groups:
   ad=tree.animation_data
   for f in list(ad.drivers) if ad else []:
    match=re.fullmatch(r'bpy\.data\.node_groups\["([^"]+)"\]\.nodes\["([^"]+)"\]\.inputs\[(\d+)\]\.default_value/2',f.driver.expression)
    if match and match.group(1)==tree.name:
     height=tree.nodes[match.group(2)].inputs[int(match.group(3))].default_value
     f.driver.expression=str(float(height)/2)
     status['presentationChanges'].append('Resolve inspected static cone height/2 driver to its numeric value; time-varying frame/110 noise driver remains unchanged. No source Python executed.')
  if not any(o.type=='LIGHT' for o in s.objects):
   for name,loc,power,size,color in [('Key',(3,-4,5),500,4,(.7,.85,1)),('Fill',(-3,-1,2),300,3,(1,.7,.45)),('Rim',(1,3,4),700,3,(1,1,1))]:
    d=bpy.data.lights.new('Presentation '+name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
    o=bpy.data.objects.new('Presentation '+name,d);s.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
   status['presentationChanges'].append('Add temporary studio lights; source has no lights.')
 for img in bpy.data.images:
  if img.source=='FILE' and not img.packed_file and img.filepath and not Path(bpy.path.abspath(img.filepath)).exists():
   candidate=(BASE/FILES[slug]).parent/Path(img.filepath.replace('\\','/')).name
   if candidate.exists():img.filepath=str(candidate);img.reload();status['presentationChanges'].append('Relink adjacent texture '+candidate.name)
 if args.eevee:
  s.render.engine='BLENDER_EEVEE_NEXT';status['presentationChanges'].append('Web preview rendered with Eevee; native scene uses Cycles.')
 ratio=s.render.resolution_y/s.render.resolution_x
 s.render.resolution_x=960;s.render.resolution_y=round(960*ratio/2)*2;s.render.resolution_percentage=100
 s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8'
 s.render.use_persistent_data=True
 if s.render.engine=='CYCLES':
  s.cycles.samples=48 if slug=='particles' else 32;s.cycles.use_denoising=True;s.cycles.max_bounces=8
  try:
   p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='OPTIX';p.get_devices()
   for d in p.devices:d.use=d.type!='CPU'
   if any(d.type!='CPU' for d in p.devices):s.cycles.device='GPU'
   status['devices']=[(d.name,d.type,d.use) for d in p.devices]
  except Exception as ex:status['gpuNote']=str(ex)
 if hasattr(s,'eevee') and hasattr(s.eevee,'taa_render_samples'):s.eevee.taa_render_samples=32
 start,end=(60,180) if slug=='particles' else (1,144)
 if orbit:start,end=(1,72) if slug=='liquid' else (1,96);status['presentationChanges'].append('New gentle camera orbit for website presentation, not original timeline animation.')
 status.update(outputSize=[s.render.resolution_x,s.render.resolution_y],exportFrames=[start,end],fps=s.render.fps/s.render.fps_base,kind='presentation-orbit' if orbit else 'source-timeline')
 bpy.context.view_layer.update()
 camera_start=s.camera.matrix_world.copy();target=Vector((0,0,.5 if slug=='liquid' else 2))
 picks={start,(start+(end-start)//4) if orbit else (start+end)//2,end} if probe else set(range(start,end+1))
 began=time.time()
 for frame in range(s.frame_start,end+1):
  s.frame_set(frame);bpy.context.view_layer.update();bpy.context.evaluated_depsgraph_get().update()
  if orbit:
   angle=math.sin((frame-start)/(end-start)*2*math.pi)*math.radians(12)
   rot=Matrix.Rotation(angle,4,'Y' if slug=='liquid' else 'Z')
   s.camera.matrix_world=Matrix.Translation(target)@rot@Matrix.Translation(-target)@camera_start
  if frame not in picks:continue
  path=out/(f'{frame:04d}.png');s.render.filepath=str(path)
  if not path.exists() or args.force:
   log('rendering',frame=frame,elapsed=round(time.time()-began,2));bpy.ops.render.render(write_still=True)
  log('rendering',frame=frame,elapsed=round(time.time()-began,2),lastOutput=str(path))
 log('probe-done' if probe else 'done',elapsed=round(time.time()-began,2))
except Exception as ex:
 log('error',error=str(ex),traceback=traceback.format_exc());raise
