export type BuildKind = 'text' | 'media' | 'frame' | 'line';
export type BuildPhase = 'waiting' | 'active' | 'done';
export type BuildState = {kind:BuildKind;duration:number;elapsed:number;phase:BuildPhase;lane:number};
export type Box = {x:number;y:number;width:number;height:number};

export const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
export function createBuildState(kind:BuildKind,characters=0):BuildState {
  return {kind,duration:kind==='text'?Math.min(2.5,1+characters*.025):kind==='media'?1.75:1.25,elapsed:0,phase:'waiting',lane:-1};
}
export function finishBuild(state:BuildState) {state.elapsed=state.duration;state.phase='done';state.lane=-1;}

/** At most one active piece per cursor; out-of-view pieces retain their playhead. */
export function advanceBuild(states:BuildState[],visible:ReadonlySet<number>,delta:number,speed=1,paused=false) {
  if(paused)return;
  const dt=Math.min(.05,Math.max(0,delta))*Math.max(.5,Math.min(3,speed));
  const occupied=new Set<number>();
  states.forEach((state,index)=>{
    if(state.phase!=='active')return;
    if(!visible.has(index)){state.lane=-1;return;}
    if(state.lane>=0)occupied.add(state.lane);
  });
  for(const index of visible){
    const state=states[index];
    if(!state||state.phase==='done')continue;
    if(state.lane<0){const free=[0,1,2].find(lane=>!occupied.has(lane));if(free===undefined)continue;state.lane=free;state.phase='active';occupied.add(free);}
    state.elapsed=Math.min(state.duration,state.elapsed+dt);
    if(state.elapsed>=state.duration){occupied.delete(state.lane);finishBuild(state);}
  }
}

export function revealProgress(state:BuildState) {
  if(state.phase==='done')return 1;
  return clamp01((state.elapsed-.3)/Math.max(.1,state.duration-.55));
}
export function visibleBox(box:Box,width:number,height:number) {
  return box.width>1&&box.height>1&&box.x<width&&box.x+box.width>0&&box.y<height&&box.y+box.height>24;
}
export function fitCursor(x:number,y:number,width:number,height:number) {
  return {x:Math.max(8,Math.min(width-84,x)),y:Math.max(25,Math.min(height-52,y))};
}
/** UTF-16 offsets for Range, without splitting emoji or combining glyphs. */
export function graphemeOffsets(text:string):{start:number;end:number}[] {
  if(typeof Intl.Segmenter==='function')return Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text),segment=>({start:segment.index,end:segment.index+segment.segment.length}));
  let offset=0;return Array.from(text).map(char=>{const start=offset;offset+=char.length;return {start,end:offset};});
}
