import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  BoxGeometry, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group,
  Mesh, MeshBasicMaterial, NoToneMapping, Object3D, OrthographicCamera, PlaneGeometry,
  Raycaster, Scene, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector2,
  Vector3, WebGLRenderer, type Material,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ChibiDocument, ChibiNode, ChibiSceneApi, ChibiSceneProps, NodeTransformPatch, ScenePointerEvent } from '@chibi3d/runtime';
import { inkOutline, printMaterial } from './print-material';

type Props = ChibiSceneProps & { document: ChibiDocument };

/** A deliberately small renderer for our keyboard document, retaining the
 * public host API used by motion/input while allowing authored print shaders. */
export function ComicScene(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef(props); callbacks.current = props;
  const resolution = useRef<() => void>(() => {});
  useEffect(() => { resolution.current(); }, [props.dpr]);
  useEffect(() => {
    const element = canvas.current!;
    const doc = props.document;
    let disposed = false, paused = false, frame = 0;
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({ canvas: element, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
    catch (error) { callbacks.current.onError?.(error instanceof Error ? error : new Error(String(error))); return; }
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    const world = new Scene();
    const camera = new OrthographicCamera();
    camera.position.fromArray(doc.camera.position);
    camera.lookAt(new Vector3().fromArray(doc.camera.target));
    camera.near = .05; camera.far = 120;
    const objects = new Map<string, Group>();
    const materials = new Map<string, Material>();
    const geometries = new Set<BufferGeometry>();
    const ownedMaterials = new Set<Material>();
    const textures = new Set<Texture>();
    const jobs: Promise<unknown>[] = [];
    const transitions = new Set<gsap.core.Tween>();
    const ink = inkOutline(); ownedMaterials.add(ink);
    const draw = () => { frame = 0; if (!disposed && !paused && !document.hidden) renderer.render(world, camera); };
    const invalidate = () => { if (!disposed && !paused && !document.hidden && !frame) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const w = innerWidth, h = innerHeight;
      const spec = callbacks.current.dpr;
      const dpr = typeof spec === 'number' ? spec : Math.min(devicePixelRatio, spec?.[1] ?? 1.5);
      renderer.setPixelRatio(Math.min(1.5, Math.max(.75, dpr)));
      renderer.setSize(w, h, false);
      const distance = camera.position.distanceTo(new Vector3().fromArray(doc.camera.target));
      const viewHeight = 2 * distance * Math.tan(doc.camera.fov * Math.PI / 360);
      camera.left = -viewHeight * w / h / 2; camera.right = -camera.left;
      camera.top = viewHeight / 2; camera.bottom = -camera.top;
      camera.updateProjectionMatrix(); invalidate();
    };
    resolution.current = resize;
    const geometryFor = (node: ChibiNode) => {
      if (node.type !== 'mesh') return null;
      const input = node.geometry;
      let geometry: BufferGeometry;
      if (input.kind === 'editableMesh') {
        geometry = new BufferGeometry();
        const vertices: number[] = [];
        for (const face of input.faces) for (let i=1; i<face.length-1; i++) {
          for (const index of [face[0],face[i],face[i+1]]) vertices.push(...input.positions.slice(index*3,index*3+3));
        }
        geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));
        geometry.computeVertexNormals();
      } else if (input.kind === 'plane') geometry = new PlaneGeometry(Number(input.params.width)||1,Number(input.params.height)||1);
      else if (input.kind === 'box') geometry = new BoxGeometry(Number(input.params.width)||1,Number(input.params.height)||1,Number(input.params.depth)||1);
      else return null; // Hidden 3D labels have equivalent accessible HTML.
      geometries.add(geometry); return geometry;
    };
    const textureLoader = new TextureLoader();
    const assetURL = async (id: string) => {
      const item = doc.assets[id];
      if (!item) throw new Error('Keyboard asset missing');
      return callbacks.current.resolveAsset ? callbacks.current.resolveAsset(item) : item.name;
    };
    const usedMaterials = new Set<string>();
    const collectMaterials = (id:string) => {
      const node=doc.nodes[id];if(!node||node.name==='Skill labels')return;
      if('materialId' in node && node.materialId)usedMaterials.add(node.materialId);
      node.children.forEach(collectMaterials);
    };
    doc.root.forEach(collectMaterials);
    for (const [id, source] of Object.entries(doc.materials)) {
      if(!usedMaterials.has(id))continue;
      const decal = Boolean(source.maps?.map);
      const material = decal
        ? new MeshBasicMaterial({ color: source.color, transparent: true, side: DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
        : printMaterial(source.color, source.name === 'Case');
      material.name = source.name;
      materials.set(id, material); ownedMaterials.add(material);
      if (decal) jobs.push(assetURL(source.maps.map!).then(url => textureLoader.loadAsync(url)).then(texture => {
        if (disposed) { texture.dispose(); return; }
        texture.colorSpace = SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        textures.add(texture); (material as MeshBasicMaterial).map = texture; material.needsUpdate = true; invalidate();
      }));
    }
    const addMesh = (parent: Object3D, geometry: BufferGeometry, material: Material, outline: boolean) => {
      const mesh = new Mesh(geometry, material); parent.add(mesh);
      if (outline) {
        const edge = new Mesh(geometry,ink); edge.raycast = () => {}; edge.renderOrder = -1; parent.add(edge);
      }
    };
    const modelLoads = new Map<string, ReturnType<GLTFLoader['loadAsync']>>();
    const loader = new GLTFLoader();
    const build = (id: string, parent: Object3D) => {
      const node = doc.nodes[id]; if (!node) return;
      const group = new Group(); group.name = node.name; group.userData.nodeId = id;
      group.position.fromArray(node.transform.position); group.rotation.fromArray([...node.transform.rotation,'XYZ']); group.scale.fromArray(node.transform.scale);
      group.visible = node.visible; parent.add(group); objects.set(id,group);
      if(node.name==='Skill labels')return;
      if (node.type === 'mesh') {
        const geometry = geometryFor(node), material = materials.get(node.materialId);
        if (geometry && material) addMesh(group,geometry,material,node.geometry.kind !== 'plane' && !material.transparent);
      } else if (node.type === 'model') {
        jobs.push(assetURL(node.assetId).then(url => {
          let pending = modelLoads.get(url);
          if (!pending) {
            pending = loader.loadAsync(url).then(gltf => {
              gltf.scene.traverse(object => {
                if(!(object instanceof Mesh))return;
                const sourceMaterials=Array.isArray(object.material)?object.material:[object.material];
                if(disposed)object.geometry.dispose();else geometries.add(object.geometry);
                for(const sourceMaterial of sourceMaterials){
                  if(disposed)sourceMaterial.dispose();else ownedMaterials.add(sourceMaterial);
                  for(const value of Object.values(sourceMaterial))if(value instanceof Texture){if(disposed)value.dispose();else textures.add(value);}
                }
              });
              return gltf;
            });
            modelLoads.set(url,pending);
          }
          return pending;
        }).then(gltf => {
          let part: Object3D | undefined = gltf.scene;
          for (const index of (node.path || '').split('/').filter(Boolean)) part = part?.children[Number(index)];
          if (!(part instanceof Mesh)) throw new Error(`Keyboard geometry missing: ${node.name}`);
          const geometry = part.geometry;
          if (disposed) { geometry.dispose(); return; }
          geometries.add(geometry);
          const material = node.materialId ? materials.get(node.materialId) : undefined;
          if (material) addMesh(group,geometry,material,true);
          else {
            // Bongo frames retain their licensed original unlit texture.
            const originals = Array.isArray(part.material) ? part.material : [part.material];
            const copies = originals.map(original => {
              const map = 'map' in original ? original.map as Texture : null;
              const copy = new MeshBasicMaterial({ map, transparent: true, side: DoubleSide, depthWrite:false });
              ownedMaterials.add(copy); if(map)textures.add(map); return copy;
            });
            group.add(new Mesh(geometry,copies.length===1?copies[0]:copies));
          }
          invalidate();
        }));
      }
      node.children.forEach(child => build(child,group));
    };
    doc.root.forEach(id => build(id,world));
    const setTransform = (id:string,patch:NodeTransformPatch) => {
      const object = objects.get(id); if(!object)return false;
      if(patch.position)object.position.fromArray(patch.position);
      if(patch.rotation)object.rotation.fromArray([...patch.rotation,'XYZ']);
      if(patch.scale)object.scale.fromArray(patch.scale);
      invalidate(); return true;
    };
    const states: Record<string,string> = {};
    const api: ChibiSceneApi = {
      setNodeTransform:setTransform,
      setNodeVisible:(id,visible)=>{const o=objects.get(id);if(!o)return false;o.visible=visible;invalidate();return true;},
      clearNodeOverrides:(id)=>{const node=doc.nodes[id];if(!node)return false;setTransform(id,node.transform);return true;},
      transitionNodeTo:(id,state,options)=>{
        const object=objects.get(id),node=doc.nodes[id];if(!object||!node)return;
        states[id]=state;
        const override=state==='base'?undefined:doc.states[state]?.overrides[id];
        const destination=(override?.['transform.position'] as number[]|undefined)||node.transform.position;
        gsap.killTweensOf(object.position);
        const tween=gsap.to(object.position,{x:destination[0],y:destination[1],z:destination[2],duration:options?.duration??.1,ease:'power2.out',onUpdate:invalidate,onComplete:()=>transitions.delete(tween),onInterrupt:()=>transitions.delete(tween)});
        transitions.add(tween);
      },
      transitionTo:()=>{},play:()=>{},pause:()=>{},stop:()=>{},getState:()=>states,
      setPaused:(next)=>{if(next&&!paused&&!disposed&&!document.hidden)renderer.render(world,camera);paused=next;if(!paused)invalidate();},getScrollProgress:()=>0,getPointer:()=>({x:.5,y:.5}),
      setMaterial:(target,patch)=>{
        let found=false;
        for(const [id,material]of materials){
          if(id!==target&&material.name!==target)continue;found=true;
          if(material instanceof ShaderMaterial){
            if(patch.color)material.uniforms.plateColor.value.set(patch.color);
            if(patch.emissiveIntensity!==undefined)material.uniforms.emphasis.value=patch.emissiveIntensity;
          }else if(material instanceof MeshBasicMaterial && patch.color)material.color.set(patch.color);
        }
        invalidate();return found;
      },
      screenshot:async(options)=>{renderer.render(world,camera);return new Promise(resolve=>element.toBlob(resolve,options?.type??'image/png',options?.quality));},
    };
    const ref=callbacks.current.api;if(typeof ref==='function')ref(api);else if(ref)ref.current=api;
    const ray=new Raycaster(),point=new Vector2(),targets=new Set(props.pointerTargets);
    let hovered:string|null=null;const downTargets=new Map<number,string>();
    const emit=(event:PointerEvent,type:ScenePointerEvent['type'],id:string)=>callbacks.current.onPointerEvent?.({type,nodeId:id,pointerId:event.pointerId,pointerType:event.pointerType});
    const pick=(event:PointerEvent)=>{
      point.set(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);ray.setFromCamera(point,camera);world.updateMatrixWorld(true);
      const hits=ray.intersectObjects(world.children,true);
      for(const hit of hits){
        let visible=true;for(let ancestor:Object3D|null=hit.object;ancestor;ancestor=ancestor.parent)if(!ancestor.visible){visible=false;break;}
        if(!visible)continue;
        for(let ancestor:Object3D|null=hit.object;ancestor;ancestor=ancestor.parent){const id=ancestor.userData.nodeId;if(targets.has(id))return id as string;}
      }
      return null;
    };
    const move=(event:PointerEvent)=>{
      const id=pick(event);if(id===hovered)return;
      if(hovered)emit(event,'hoverExit',hovered);hovered=id;if(id)emit(event,'hoverEnter',id);
    };
    const down=(event:PointerEvent)=>{const id=pick(event);if(id){downTargets.set(event.pointerId,id);element.setPointerCapture(event.pointerId);emit(event,'pointerDown',id);}};
    const up=(event:PointerEvent)=>{const id=downTargets.get(event.pointerId);if(id){emit(event,'pointerUp',id);downTargets.delete(event.pointerId);}if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);};
    const cancel=(event:PointerEvent)=>{const id=downTargets.get(event.pointerId);if(id)emit(event,'pointerCancel',id);downTargets.delete(event.pointerId);};
    const leave=(event:PointerEvent)=>{if(hovered)emit(event,'hoverExit',hovered);hovered=null;};
    const blur=()=>{downTargets.clear();hovered=null;};
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else invalidate();};
    const lost=(event:Event)=>{event.preventDefault();callbacks.current.onError?.(new Error('WebGL context lost'));};
    element.addEventListener('pointermove',move);element.addEventListener('pointerdown',down);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',cancel);element.addEventListener('pointerleave',leave);
    element.addEventListener('webglcontextlost',lost);window.addEventListener('resize',resize);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
    resize();
    Promise.all(jobs).then(()=>{if(!disposed){invalidate();callbacks.current.onLoad?.();}}).catch(error=>{if(!disposed)callbacks.current.onError?.(error instanceof Error?error:new Error(String(error)));});
    return()=>{
      disposed=true;cancelAnimationFrame(frame);resolution.current=()=>{};
      transitions.forEach(t=>t.kill());for(const object of objects.values())gsap.killTweensOf(object.position);
      element.removeEventListener('pointermove',move);element.removeEventListener('pointerdown',down);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',cancel);element.removeEventListener('pointerleave',leave);element.removeEventListener('webglcontextlost',lost);
      window.removeEventListener('resize',resize);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);
      geometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();
      if(typeof ref==='function')ref(null);else if(ref)ref.current=null;
    };
  }, [props.document]);
  return <canvas ref={canvas} className="comic-keyboard-canvas" style={props.style} aria-label="可以旋转和按压的漫画键盘"/>;
}
