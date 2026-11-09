// Adapted from Naresh Khatri's MIT portfolio. See licenses/Naresh-Khatri-MIT.txt.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type ChibiSceneApi, type ScenePointerEvent } from '@chibi3d/runtime';
import { ComicScene } from './ComicScene';
import { DefaultLoadingManager } from 'three';
import { createKeyboardScene, resolveKeyboardAsset, type KeyboardKey } from './scene';
import { createKeyboardMotion, isReadingSection, type KeyboardSection } from './motion';
import { createKeyInput, isTypingTarget } from './input';
import { useKeyboardSounds } from './use-keyboard-sounds';
import { useAdaptiveGraphics } from './use-adaptive-graphics';
import { createCounterMotion } from './counter-motion';
import { asset, type Skill } from '../data';

DefaultLoadingManager.setURLModifier(url => url.startsWith('/fonts/') ? asset(url) : url);
const SceneCanvas = memo(ComicScene);
const style = { position:'fixed' as const,inset:0,width:'100vw',height:'100dvh' };
type Props = { skills:Skill[]; sound:boolean; playful:boolean; petSignal:number; rotationSignal:number; focusKey?:string|null; onReady:(ready:boolean)=>void; onSelect:(skill:Skill|null)=>void; onSection:(section:KeyboardSection)=>void; onOpen:(skill:Skill)=>void };
export default function KeyboardScene({skills,sound,playful,petSignal,rotationSignal,focusKey=null,onReady,onSelect,onSection,onOpen}:Props) {
  const api = useRef<ChibiSceneApi>(null);
  const [ready,setReady] = useState(false);
  const [motionSection,setMotionSection] = useState<KeyboardSection>('hero');
  const [failed,setFailed] = useState(false);
  const callbacks=useRef({onSelect,onSection,onOpen,sound,playful,onReady,focusKey});
  callbacks.current={onSelect,onSection,onOpen,sound,playful,onReady,focusKey};
  const scene=useMemo(()=>createKeyboardScene(skills),[skills]);
  const input=useMemo(()=>createKeyInput(scene.keys,scene.columns),[scene]);
  const play=useKeyboardSounds();
  const {settings,markActive}=useAdaptiveGraphics(ready);
  const held=useRef<KeyboardKey[]>([]);
  const hovered=useRef<KeyboardKey|null>(null);
  const currentSection=useRef<KeyboardSection>('hero');
  const count=useRef(0);
  const counter=useRef<ReturnType<typeof createCounterMotion>|null>(null);
  const controller=useRef<ReturnType<typeof createKeyboardMotion>|null>(null);
  const syncSelection=useCallback(()=>{
    const shown=held.current.at(-1)||hovered.current||scene.keys.find(key=>key.skill.name===callbacks.current.focusKey);
    callbacks.current.onSelect(isReadingSection(currentSection.current)?null:(shown?.skill as Skill)??null);
  },[scene]);
  const gesture=useRef({id:-1,x:0,y:0,originX:0,originY:0,moved:false,active:false,type:'mouse',lastPet:0});
  const environment=useMemo(()=>({...scene.document.environment,...settings,preset:settings.lighting?scene.document.environment.preset:null,contactShadows:false,vignette:false}),[scene,settings]);
  const dpr=useMemo<[number,number]>(()=>[0.5,Math.min(settings.dpr,1.5)],[settings.dpr]);
  useEffect(()=>{
    if(!ready)return;
    const sync=()=>{const color=document.documentElement.dataset.theme==='light'?'#172033':'#ffffff';for(const [id,material]of Object.entries(scene.document.materials))if(material.name==='Skill text'||material.name.startsWith('Description ')||material.name.startsWith('Heading '))api.current?.setMaterial(id,{color});markActive();};
    sync();const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return()=>observer.disconnect();
  },[ready,scene,markActive]);
  useEffect(()=>{
    if (!ready || !api.current) return;
    const cm=createCounterMotion(api.current,scene.counter,markActive); counter.current=cm;
    cm.update(count.current,true);
    const motion=createKeyboardMotion(api.current,scene,(section)=>{
      currentSection.current=section;setMotionSection(section);hovered.current=null;input.releaseAll();syncSelection();callbacks.current.onSection(section);
    },markActive);
    controller.current=motion;
    motion.setCounterEnabled(true);motion.setPlayful(callbacks.current.playful);motion.setFocusKey(callbacks.current.focusKey);motion.reveal();
    return ()=>{motion.dispose();cm.dispose();controller.current=null;counter.current=null;};
  },[ready,scene,input,markActive,syncSelection]);
  useEffect(()=>{controller.current?.setPlayful(playful);},[playful,ready]);
  // A gallery selection arrives while the board is still hidden in a reading
  // chapter. Apply that pending selection again once navigation reaches it.
  useEffect(()=>{controller.current?.setFocusKey(focusKey);syncSelection();},[focusKey,ready,motionSection,syncSelection]);
  useEffect(()=>{if(petSignal)controller.current?.pet();},[petSignal]);
  useEffect(()=>{if(rotationSignal)controller.current?.rotateBy(Math.PI/3);},[rotationSignal]);
  useEffect(()=>{
    if(!ready)return;
    let lastScroll=window.scrollY,lastScrollTime=performance.now();
    const scroll=()=>{const now=performance.now();controller.current?.setScroll((window.scrollY-lastScroll)/Math.max(16,now-lastScrollTime)/2.5);lastScroll=window.scrollY;lastScrollTime=now;};
    const down=(e:PointerEvent)=>{const g=gesture.current;g.x=g.originX=e.clientX;g.y=g.originY=e.clientY;g.id=e.pointerId;g.moved=false;g.active=false;g.type=e.pointerType;};
    const move=(e:PointerEvent)=>{
      if(isReadingSection(currentSection.current)||document.querySelector('dialog[open],[data-swarm-active]'))return;
      const g=gesture.current;
      if(!g.active&&!e.buttons)g.moved=false;
      controller.current?.setPointer((e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2);
      if(!g.active||e.pointerId!==g.id)return;
      const dx=e.clientX-g.x,dy=e.clientY-g.y,totalX=e.clientX-g.originX,totalY=e.clientY-g.originY;
      if(!g.moved&&Math.hypot(totalX,totalY)>7){
        if(g.type==='touch'&&Math.abs(totalY)>Math.abs(totalX)){g.active=false;g.moved=true;input.release(`pointer:${g.id}`);return;}
        g.moved=true;hovered.current=null;controller.current?.setHoveredKey(null);syncSelection();input.release(`pointer:${g.id}`);controller.current?.beginDrag();document.documentElement.classList.add('dragging-keyboard');
      }
      if(g.moved){controller.current?.drag(dx,dy);if(e.cancelable&&e.pointerType==='mouse')e.preventDefault();}
      g.x=e.clientX;g.y=e.clientY;
    };
    const up=()=>{gesture.current.active=false;controller.current?.endDrag();input.release(`pointer:${gesture.current.id}`);document.documentElement.classList.remove('dragging-keyboard');};
    window.addEventListener('pointerdown',down,true);window.addEventListener('pointermove',move,{capture:true,passive:false});window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);window.addEventListener('blur',up);window.addEventListener('scroll',scroll,{passive:true});
    return()=>{window.removeEventListener('pointerdown',down,true);window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);window.removeEventListener('blur',up);window.removeEventListener('scroll',scroll);up();};
  },[ready,input,syncSelection]);
  useEffect(()=>input.subscribe((key,pressed)=>{
    markActive();
    api.current?.transitionNodeTo(key.nodeId,pressed?key.pressedStateId:'base',{duration:0.1,ease:'easeInOut'});
    controller.current?.setKeyPressed(key.skill.name,pressed);
    held.current=held.current.filter(k=>k!==key);
    if(pressed){held.current.push(key);count.current++;counter.current?.update(count.current,true);if(callbacks.current.playful)controller.current?.pet();}
    // The HTML skills stage owns the single readable label. Keep its 3D duplicate hidden.
    api.current?.setNodeVisible(scene.labelsId,false);
    syncSelection();
    if(callbacks.current.sound&&!isReadingSection(currentSection.current))play(pressed);
  }),[input,scene,play,markActive,syncSelection]);
  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      if(!ready||isReadingSection(currentSection.current)||event.defaultPrevented||event.repeat||event.ctrlKey||event.metaKey||event.altKey||isTypingTarget(event.target)||document.querySelector('dialog[open],[data-swarm-active]'))return;
      const key=input.shortcuts.get(event.code);
      if(key)input.press(`key:${event.code}`,key.nodeId);
      if(event.key==='Enter'&&held.current.length)callbacks.current.onOpen(held.current.at(-1)!.skill as Skill);
    };
    const up=(e:KeyboardEvent)=>input.release(`key:${e.code}`);
    const release=()=>{input.releaseAll();hovered.current=null;controller.current?.setHoveredKey(null);syncSelection();};
    const visibility=()=>{if(document.hidden)release();};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',release);document.addEventListener('visibilitychange',visibility);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',visibility);release();};
  },[input,ready,syncSelection]);
  useEffect(()=>{
    if(ready)return;
    const id=window.setTimeout(()=>{setFailed(true);callbacks.current.onReady(false);},20000);
    return ()=>clearTimeout(id);
  },[ready]);
  const onPointerEvent=useCallback((event:ScenePointerEvent)=>{
    if(isReadingSection(currentSection.current)||document.querySelector('dialog[open],[data-swarm-active]'))return;
    const source=`pointer:${event.pointerId}`;
    const cat=scene.frameIds.includes(event.nodeId);
    if(cat){
      if(event.type==='hoverEnter'&&performance.now()-gesture.current.lastPet>400){controller.current?.pet();gesture.current.lastPet=performance.now();}
      if(event.type==='pointerDown'){controller.current?.pet();if(callbacks.current.sound)play(true);}
      return;
    }
    if(event.type==='hoverEnter'&&event.pointerType==='mouse'&&!gesture.current.moved){
      hovered.current=scene.keys.find(key=>key.nodeId===event.nodeId)??null;
      controller.current?.setHoveredKey(hovered.current?.skill.name??null);syncSelection();
    }
    if(event.type==='hoverExit'&&hovered.current?.nodeId===event.nodeId){
      hovered.current=null;controller.current?.setHoveredKey(null);syncSelection();
    }
    if(event.type==='pointerDown'){gesture.current.active=true;input.press(source,event.nodeId);}
    if(event.type==='pointerUp'){
      const key=scene.keys.find(k=>k.nodeId===event.nodeId);
      input.release(source);
      if(key&&!gesture.current.moved)callbacks.current.onOpen(key.skill as Skill);
    }
    if(event.type==='pointerCancel')input.release(source);
  },[input,scene,play,syncSelection]);
  const exportPoster=async()=>{
    const blob=await api.current?.screenshot({type:'image/png',transparent:true});
    if(!blob)return;
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='yo7-comic-keyboard.png';link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  if(failed)return null;
  return <><SceneCanvas document={scene.document} environment={environment} resolveAsset={resolveKeyboardAsset} api={api} style={style} dpr={dpr} transparent orbit={false} orthographic pointerTargets={scene.pointerTargets} onPointerEvent={onPointerEvent} onLoad={()=>{setReady(true);callbacks.current.onReady(true);}} onError={(error)=>{console.warn('Keyboard unavailable',error);setFailed(true);callbacks.current.onReady(false);}} onEvent={event=>{if(event.type==='contextLost'){setFailed(true);callbacks.current.onReady(false);}}} />{import.meta.env.DEV&&new URLSearchParams(location.search).has('keyboard-capture')&&<button type="button" onClick={exportPoster} disabled={!ready} style={{position:'fixed',bottom:20,left:20,zIndex:99999,padding:'16px 24px',background:'#f4dd22',color:'#171632',border:'3px solid #171632',pointerEvents:'auto'}}>导出透明键盘 PNG</button>}</>;
}
