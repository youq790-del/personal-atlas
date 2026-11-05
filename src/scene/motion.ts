// Adapted from Naresh Khatri / 3d-portfolio (MIT). See licenses/Naresh-Khatri-MIT.txt.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Color, Euler, Quaternion } from "three";
import type { ChibiSceneApi, Vec3 } from "@chibi3d/runtime";
import type { KeyboardScene } from "./scene";
import { isReadingSection, isSkillsSection, resolveKeyboardSection, type KeyboardSection } from "./sections";
export { isReadingSection, isSkillsSection, resolveKeyboardSection, type KeyboardSection } from "./sections";

type Vector = { x: number; y: number; z: number };
const vector = (v: Vec3): Vector => ({ x: v[0], y: v[1], z: v[2] });
const array = (v: Vector): Vec3 => [v.x, v.y, v.z];

// Animate the original Euler components before converting camera coordinates.
// Equivalent end rotations do not produce equivalent GSAP transition paths.
function sectionRotation(rotation: Vector, mobile: boolean): Vec3 {
  const skills = new Quaternion().setFromEuler(new Euler(0.119863065, 0.007200782, 0.119863065));
  const reference = new Quaternion().setFromEuler(new Euler(0, mobile ? -Math.PI / 6 : -Math.PI / 12, 0));
  const legacy = new Quaternion().setFromEuler(new Euler(rotation.x, rotation.y, rotation.z));
  const euler = new Euler().setFromQuaternion(skills.multiply(reference).multiply(legacy));
  return [euler.x, euler.y, euler.z];
}

/** GSAP animates host values; Chibi applies them through its public API. */
export function createKeyboardMotion(
  api: ChibiSceneApi,
  scene: KeyboardScene,
  onSection: (section: KeyboardSection) => void,
  onActivity?: () => void,
) {
  gsap.registerPlugin(ScrollTrigger);
  const setTransform: ChibiSceneApi["setNodeTransform"] = (id, patch) => {
    onActivity?.();
    return api.setNodeTransform(id, patch);
  };
  let section: KeyboardSection = "hero";
  let disposed = false;
  let started = false;
  let keyboardRevealed = false;
  let notifiedSection: KeyboardSection | null = null;
  const notifySection = (next: KeyboardSection) => {
    if(notifiedSection===next)return;
    notifiedSection=next;onSection(next);
  };
  let playful = false;
  let focusedKey: string | null = null;
  let hoveredKey: string | null = null;
  const pressedKeys = new Set<string>();
  const position = vector([0, 0, 0]);
  const scale = vector([0.001, 0.001, 0.001]);
  const rotation = vector([0, 0, 0]);
  const revealScale = { value: 0.001 };
  const keyOffsets = scene.keys.map(() => ({ y: 0 }));
  const keyRevealOffsets = scene.keys.map(() => ({ y: 0 }));
  // A separate attention offset composes with presses, assembly, and teardown.
  const keyAttention = scene.keys.map(() => ({ y: 0, brightness: 1, glow: 0 }));
  const keyColors = scene.keys.map(key => new Color(scene.document.materials[key.materialId].color));
  const keyPaint = keyColors.map(color => color.clone());
  const attentionTweens: (gsap.core.Tween | undefined)[] = scene.keys.map(() => undefined);
  const catFrame = { value: 0 };
  const interaction = {x:0,y:0,vx:0,vy:0,targetX:0,targetY:0,px:0,py:0,dragging:false,awake:0,pet:0,petV:0,scroll:0};
  const catBase = scene.document.nodes[scene.catId].transform;
  let petReset:gsap.core.Tween|undefined;
  const touchTick = (_time:number,delta:number) => {
    if(disposed||document.hidden||isReadingSection(section)||interaction.awake<=0)return;
    interaction.awake--;
    const dt=Math.min(2,delta/16.667);
    interaction.vx+=(interaction.targetX-interaction.x)*.1*dt;
    interaction.vy+=(interaction.targetY-interaction.y)*.1*dt;
    interaction.vx*=Math.pow(.72,dt);interaction.vy*=Math.pow(.72,dt);
    interaction.x+=interaction.vx*dt;interaction.y+=interaction.vy*dt;
    interaction.scroll*=Math.pow(.9,dt);
    setTransform(scene.spinId,{rotation:[interaction.x+interaction.py*.045+interaction.scroll*.025,interaction.y+interaction.px*.055,-interaction.px*.025],scale:[1-Math.abs(interaction.scroll)*.012,1+Math.abs(interaction.scroll)*.04,1]});
    if(playful&&section==='skills'){
      interaction.petV+=-interaction.pet*.075*dt;interaction.petV*=Math.pow(.82,dt);interaction.pet+=interaction.petV*dt;
      const pulse=interaction.pet;
      setTransform(scene.catId,{rotation:[catBase.rotation[0]+interaction.py*.07,catBase.rotation[1]+interaction.px*.1,catBase.rotation[2]+interaction.px*.12],scale:[1+pulse*.22,1-pulse*.17,1],position:[catBase.position[0],catBase.position[1]+Math.abs(pulse)*.22,catBase.position[2]]});
    }
  };
  let touchTickActive = false;
  const setTouchTickActive = (active: boolean) => {
    if (active === touchTickActive) return;
    touchTickActive = active;
    if (active) gsap.ticker.add(touchTick);
    else gsap.ticker.remove(touchTick);
  };
  const pet = () => {
    if(!playful||section!=='skills')return;
    interaction.pet=.9;interaction.petV=.13;interaction.awake=110;
    scene.frameIds.forEach((id,i)=>api.setNodeVisible(id,i===1));onActivity?.();
    petReset?.kill();
    petReset=gsap.delayedCall(.3,()=>{if(section==='skills'&&playful)scene.frameIds.forEach((id,i)=>api.setNodeVisible(id,i===0));});
  };
  const applyKey = (index: number) => {
    setTransform(scene.keys[index].motionId, { position: [0, keyOffsets[index].y + keyRevealOffsets[index].y + keyAttention[index].y, 0] });
  };
  const paintKey = (index: number) => {
    const key = scene.keys[index], attention = keyAttention[index];
    applyKey(index);
    api.setMaterial(key.materialId, {
      color: '#' + keyPaint[index].copy(keyColors[index]).multiplyScalar(attention.brightness).getHexString(),
      emissive: scene.document.materials[key.materialId].color,
      emissiveIntensity: attention.glow,
    });
  };
  const refreshKey = (index: number, immediate = false) => {
    const name = scene.keys[index].skill.name;
    const focused = name === focusedKey, hovered = name === hoveredKey, pressed = pressedKeys.has(name);
    const active = isSkillsSection(section);
    const target = {
      y: active ? focused ? 0.24 : hovered ? 0.11 : 0 : 0,
      brightness: active && focusedKey && !focused ? hovered || pressed ? 0.72 : 0.32 : 1,
      glow: active ? pressed ? 0.48 : focused ? 0.22 : hovered ? 0.1 : 0 : 0,
    };
    attentionTweens[index]?.kill();
    attentionTweens[index] = gsap.to(keyAttention[index], {
      ...target, duration: immediate ? 0 : 0.28, ease: 'power2.out',
      onUpdate: () => paintKey(index),
    });
  };
  const refreshAttention = (immediate = false) => scene.keys.forEach((_, index) => refreshKey(index, immediate));
  const sectionTweens: gsap.core.Tween[] = [];
  const revealTweens: gsap.core.Tween[] = [];
  const pending: gsap.core.Tween[] = [];
  let counterWanted = false;
  let counterEnabled = false;
  let counterVisible = false;
  const showCounter = (visible: boolean) => {
    counterWanted = visible;
    const next = visible && counterEnabled && section === "skills" && !playful && !focusedKey;
    if (next === counterVisible) return;
    counterVisible = next;
    api.setNodeVisible(scene.counterId, next);
    onActivity?.();
  };
  const inSkills = () => {
    const bounds = document.getElementById("skills")?.getBoundingClientRect();
    return Boolean(bounds && bounds.top <= window.innerHeight * 0.5 && bounds.bottom > window.innerHeight * 0.2);
  };
  const applyPose = () => {
    setTransform(scene.boardId, {
      position: array(position),
      scale: array(scale),
      rotation: sectionRotation(rotation, window.innerWidth < 768),
    });
  };
  const pose = () => {
    const mobile = window.innerWidth < 768;
    const compactMobileFocus = mobile && window.innerHeight < 700;
    const fit = Math.min(1, window.innerWidth / window.innerHeight * 1.05);
    const [centerX, centerY, centerZ] = scene.document.camera.target;
    const baseSize = fit * (mobile ? 0.75 : 0.78);
    const focused = Boolean(focusedKey) && isSkillsSection(section);
    const size = focused ? fit * (compactMobileFocus ? 0.30 : mobile ? 0.39 : 0.42) : baseSize;
    const right = focused ? mobile ? 0 : 3.45 : 0;
    const up = focused ? compactMobileFocus ? -2.9 : mobile ? -3.8 : -1.35 : 0;
    return {
      // The placement origin is the keyboard's geometry center, independent of its labels.
      position: {
        x: centerX + right / Math.sqrt(2) + up / Math.sqrt(6),
        y: centerY + up * Math.sqrt(2 / 3),
        z: centerZ + right / Math.sqrt(2) - up / Math.sqrt(6),
      },
      rotation: !focused && isSkillsSection(section) && playful
        ? { x: Math.PI, y: Math.PI / 3, z: Math.PI }
        : { x: 0, y: isSkillsSection(section) ? (mobile ? Math.PI / 6 : Math.PI / 12) : 0, z: 0 },
      scale: { x: size, y: size, z: size },
    };
  };
  const kill = (tweens: gsap.core.Tween[]) => {
    tweens.splice(0).forEach((tween) => tween.kill());
  };
  const applySection = (next: KeyboardSection, immediate = false) => {
    if (disposed) return;
    const entering = !isSkillsSection(section) && isSkillsSection(next);
    section = next;
    hoveredKey = null;
    if (!isSkillsSection(next)) {
      petReset?.kill();
      interaction.targetX=0;interaction.targetY=0;interaction.dragging=false;interaction.awake=0;interaction.scroll=0;
      notifySection(next);
      setTouchTickActive(false);
      kill(sectionTweens);kill(pending);kill(revealTweens);
      attentionTweens.forEach(tween=>tween?.kill());
      focusedKey=null;
      api.setNodeVisible(scene.boardId,false);
      api.setNodeVisible(scene.counterId,false);
      counterVisible=false;
      counterWanted=false;
      api.setNodeVisible(scene.catId,false);
      api.setNodeVisible(scene.labelsId,false);
      scene.keys.forEach(key=>api.setNodeVisible(key.motionId,false));
      scene.frameIds.forEach(id=>api.setNodeVisible(id,false));
      api.setPaused(true);
      return;
    }
    petReset?.kill();
    interaction.targetX=0;interaction.targetY=0;interaction.dragging=false;interaction.awake=100;
    notifySection(next);
    setTouchTickActive(!document.hidden);
    api.setPaused(document.hidden);
    kill(sectionTweens);
    kill(pending);
    kill(revealTweens);
    // A section change can interrupt the first assembly.
    // Restore every cap now, rather than waiting for a delayed previous animation.
    revealScale.value = 1;
    setTransform(scene.revealId, { scale: [1, 1, 1] });
    scene.keys.forEach((key, index) => {
      keyOffsets[index].y = 0;
      keyRevealOffsets[index].y = 0;
      api.setNodeVisible(key.motionId, true);
      applyKey(index);
    });
    api.setNodeVisible(scene.labelsId, false);
    api.setNodeVisible(scene.catId, false);
    scene.frameIds.forEach(id => api.setNodeVisible(id, false));
    api.setNodeVisible(scene.boardId, true);
    refreshAttention(immediate);
    showCounter(next === "skills" && inSkills());
    const target = pose();
    for (const [value, destination] of [[position, target.position], [rotation, target.rotation], [scale, target.scale]] as const) {
      sectionTweens.push(gsap.to(value, { ...destination, duration: immediate ? 0 : 0.9, ease: "power2.out", overwrite: true, onUpdate: applyPose }));
    }
    // The visitor now owns rotation. No automatic loop fights a drag gesture.
    if (next === "skills" && playful && !focusedKey) {
      // Keep the original two-frame bongo interaction inside the playable stage.
      pending.push(gsap.delayedCall(immediate ? 0 : 0.45, () => {
        if (disposed || section !== "skills" || !playful || focusedKey) return;
        api.setNodeVisible(scene.catId, true);
        catFrame.value = 0;
        let displayedFrame = -1;
        const showFrame = () => {
          const frame = Math.floor(catFrame.value) % 2;
          if (frame === displayedFrame) return;
          displayedFrame = frame;
          scene.frameIds.forEach((id, index) => api.setNodeVisible(id, index === frame));
          onActivity?.();
        };
        showFrame();
        interaction.awake=100;
        onVisibility();
      }));
    }
    // Begin the assembly only after the keyboard enters its dedicated stage.
    if(entering&&!keyboardRevealed)revealKeyboard();
    onVisibility();
  };
  const revealKeyboard = () => {
    if(keyboardRevealed||!isSkillsSection(section)||disposed)return;
    keyboardRevealed=true;
    revealScale.value=0.001;
    setTransform(scene.revealId,{scale:[revealScale.value,revealScale.value,revealScale.value]});
    revealTweens.push(gsap.to(revealScale,{value:1,duration:1.5,ease:'elastic.out(1,0.6)',onUpdate:()=>setTransform(scene.revealId,{scale:[revealScale.value,revealScale.value,revealScale.value]})}));
    scene.keys.forEach((key,index)=>{
      const offset=keyRevealOffsets[index];
      offset.y=(200-50)/296.741333;
      api.setNodeVisible(key.motionId,false);
      applyKey(index);
      revealTweens.push(gsap.delayedCall(.9+index*.07,()=>{if(isSkillsSection(section))api.setNodeVisible(key.motionId,true);}));
      revealTweens.push(gsap.to(offset,{y:0,delay:1+index*.07,duration:.5,ease:'bounce.out',onUpdate:()=>applyKey(index)}));
    });
  };
  const onVisibility = () => {
    const hidden = document.hidden;
    petReset?.paused(hidden);
    setTouchTickActive(isSkillsSection(section)&&!hidden);
    api.setPaused(hidden||!isSkillsSection(section));
    [...sectionTweens, ...revealTweens, ...pending, ...attentionTweens].forEach((t) => t?.paused(hidden||!isSkillsSection(section)));
  };
  const syncSection = () => {
    const ids: KeyboardSection[]=['hero','discovery','skills','projects','writing','experience','contact'];
    const anchors=ids.map(id=>document.getElementById(id)).filter((node):node is HTMLElement=>Boolean(node))
      .sort((left,right)=>left.compareDocumentPosition(right)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)
      .map(element=>({id:element.id as KeyboardSection,top:element.getBoundingClientRect().top}));
    const skillBounds=document.getElementById('skills')?.getBoundingClientRect();
    return resolveKeyboardSection(anchors,window.innerHeight,skillBounds?{top:skillBounds.top,bottom:skillBounds.bottom}:undefined);
  };
  const reconcile = (immediate = false) => {
    if (!started || disposed) return;
    const next = syncSection();
    if (next !== section || immediate) applySection(next, immediate);
    else showCounter(isSkillsSection(section) && inSkills());
  };
  let refreshFrame=0;
  let refreshing=false;
  let refreshPose=false;
  const reconcileAfterRefresh=(immediate=false)=>{
    refreshPose ||= immediate;
    if(refreshFrame||disposed)return;
    refreshFrame=requestAnimationFrame(()=>{
      refreshFrame=0;
      if(refreshing){reconcileAfterRefresh();return;}
      const updatePose=refreshPose;refreshPose=false;
      reconcile(updatePose);
    });
  };
  const refreshStart=()=>{refreshing=true;};
  const refreshEnd=()=>{refreshing=false;reconcileAfterRefresh();};
  ScrollTrigger.addEventListener('refreshInit',refreshStart);
  ScrollTrigger.addEventListener('refresh',refreshEnd);
  // Read live element order so rearranging the author chapters cannot stale the scene state.
  const triggers = [ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: () => {if(refreshing||refreshFrame)reconcileAfterRefresh();else reconcile();},
    onRefresh: () => reconcileAfterRefresh(),
  })];
  const resize = () => reconcileAfterRefresh(true);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  api.setNodeVisible(scene.boardId, false);
  api.setNodeVisible(scene.catId,false);
  api.setNodeVisible(scene.counterId,false);
  api.setPaused(true);
  return {
    setFocusKey(name: string | null) {
      const next = name && scene.keys.some(key => key.skill.name === name) ? name : null;
      if (disposed || next === focusedKey) return;
      focusedKey = next;
      if (!isSkillsSection(section)) return;
      kill(revealTweens); kill(pending);
      revealScale.value = 1;
      setTransform(scene.revealId, { scale: [1, 1, 1] });
      scene.keys.forEach((key, index) => {
        keyOffsets[index].y = 0;
        keyRevealOffsets[index].y = 0;
        api.setNodeVisible(key.motionId, true);
      });
      if (playful && !next) { applySection(section); return; }
      refreshAttention();
      showCounter(isSkillsSection(section) && inSkills());
      interaction.targetX = 0; interaction.targetY = 0; interaction.awake = 100;
      const target = pose();
      kill(sectionTweens);
      for (const [value, destination] of [[position, target.position], [rotation, target.rotation], [scale, target.scale]] as const) {
        sectionTweens.push(gsap.to(value, { ...destination, duration: 0.85, ease: 'power3.inOut', overwrite: true, onUpdate: applyPose }));
      }
      onVisibility();
    },
    setHoveredKey(name: string | null) {
      if (disposed || !isSkillsSection(section) || name === hoveredKey) return;
      const previous = hoveredKey; hoveredKey = name;
      scene.keys.forEach((key, index) => {
        if (key.skill.name === previous || key.skill.name === name) refreshKey(index);
      });
    },
    setKeyPressed(name: string, pressed: boolean) {
      if (disposed) return;
      if (pressed) pressedKeys.add(name); else pressedKeys.delete(name);
      const index = scene.keys.findIndex(key => key.skill.name === name);
      if (index !== -1 && isSkillsSection(section)) refreshKey(index);
    },
    setPointer(x:number,y:number){if(!isSkillsSection(section))return;interaction.px=x;interaction.py=y;interaction.awake=90;},
    setScroll(value:number){if(!isSkillsSection(section))return;interaction.scroll=Math.max(-1,Math.min(1,value));interaction.awake=90;},
    beginDrag(){if(!isSkillsSection(section))return;interaction.dragging=true;interaction.awake=90;},
    drag(dx:number,dy:number){
      if(!isSkillsSection(section))return;
      interaction.targetY+=dx*.008;interaction.targetX=Math.max(-.9,Math.min(.9,interaction.targetX+dy*.006));interaction.awake=100;
    },
    endDrag(){if(!isSkillsSection(section))return;interaction.dragging=false;interaction.awake=110;},
    rotateBy(amount:number){if(!isSkillsSection(section))return;interaction.targetY+=amount;interaction.awake=120;},
    pet,
    setPlayful(enabled: boolean) {
      if (disposed || playful === enabled) return;
      playful = enabled;
      if (isSkillsSection(section)) applySection(section);
    },
    setCounterEnabled(enabled: boolean) {
      if (disposed || enabled === counterEnabled) return;
      counterEnabled = enabled;
      showCounter(counterWanted);
    },
    reveal() {
      if (started || disposed) return;
      started = true;
      reconcile(true);
    },
    dispose() {
      disposed = true;
      petReset?.kill();
      setTouchTickActive(false);
      if(refreshFrame)cancelAnimationFrame(refreshFrame);
      kill(sectionTweens); kill(revealTweens); kill(pending);
      attentionTweens.forEach(tween => tween?.kill());
      scene.keys.forEach(key => api.setMaterial(key.materialId, { color: scene.document.materials[key.materialId].color, emissiveIntensity: 0 }));
      triggers.forEach((t) => t.kill());
      ScrollTrigger.removeEventListener('refreshInit',refreshStart);
      ScrollTrigger.removeEventListener('refresh',refreshEnd);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      [scene.boardId, scene.spinId, scene.revealId, ...scene.keys.map((key) => key.motionId), ...scene.frameIds, scene.labelsId].forEach((id) => api.clearNodeOverrides(id));
      api.clearNodeOverrides(scene.counterId);
      api.setNodeVisible(scene.catId, false);
      api.clearNodeOverrides(scene.catId);
    },
  };
}
