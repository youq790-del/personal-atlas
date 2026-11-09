import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {Icon} from './Icon';
import {advanceBuild,finishBuild,fitCursor,visibleBox} from './swarm/model';
import {collectBlueprint,measureGlyphs,measurePiece,type Piece} from './swarm/blueprint';
import {paintMask,paintRulers,paintSelection} from './swarm/paint';
import './swarm-rebuild.css';

gsap.registerPlugin(useGSAP);
type Props={reduced:boolean;onClose:()=>void};

/** Opt-in visual reconstruction. The existing site is never replaced or serialized. */
export default function SwarmRebuild({reduced,onClose}:Props){
  const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),exit=useRef<HTMLButtonElement>(null);
  const [paused,setPaused]=useState(false),[speed,setSpeed]=useState(1),[replay,setReplay]=useState(0);
  const [report,setReport]=useState({done:0,total:0,active:0}),[failed,setFailed]=useState(false);
  const latest=useRef({paused,speed,reduced,onClose});latest.current={paused,speed,reduced,onClose};
  const wake=useRef(()=>{});
  const close=useCallback(()=>latest.current.onClose(),[]);
  const complete=report.total>0&&report.done>=report.total;

  useEffect(()=>{
    const page=document.getElementById('root'),wasInert=page?.inert||false,previous=document.activeElement as HTMLElement|null;
    if(page)page.inert=true;
    exit.current?.focus({preventScroll:true});
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return;}
      if(event.key==='Tab'){
        const controls=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')||[]);
        const first=controls[0],last=controls.at(-1);
        if(!root.current?.contains(document.activeElement)){event.preventDefault();first?.focus();}
        else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener('keydown',key,true);
    return()=>{window.removeEventListener('keydown',key,true);if(page)page.inert=wasInert;const target=previous?.isConnected&&!previous.closest('dialog')?previous:document.querySelector<HTMLElement>('[data-swarm-launch]');target?.focus({preventScroll:true});};
  },[close]);

  useGSAP(()=>{
    const surface=canvas.current,host=document.querySelector<HTMLElement>('.space-app');
    if(!surface||!host)return;
    const ctx=surface.getContext('2d');if(!ctx){setFailed(true);return;}
    let disposed=false,dirty=true,lastPaint=0,needsGlyphs=true;
    let width=innerWidth,height=innerHeight,bg='#030712',fade=1,pointerAge=0;
    const pieces=collectBlueprint(host),states=pieces.map(piece=>piece.state),regions=new Map<HTMLElement,Piece[]>();
    const backdrops=Array.from(host.querySelectorAll<HTMLElement>('.editorial-world,.contact-finale')).map(element=>({element,color:getComputedStyle(element).backgroundColor}));
    pieces.forEach(piece=>regions.set(piece.region,[...(regions.get(piece.region)||[]),piece]));
    const cursors=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-swarm-cursor]')||[]);
    const pointer={x:width*.55,y:height*.45,active:false};
    const tips=Array.from({length:3},(_,i)=>({x:width/2+(i-1)*42,y:height/2}));
    let reported='';
    const publish=(active=0)=>{const done=states.filter(s=>s.phase==='done').length,signature=`${done}/${states.length}/${active}`;if(signature!==reported){reported=signature;setReport({done,total:states.length,active});}};
    const resize=()=>{
      width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);
      surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      bg=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#030712';
      dirty=true;needsGlyphs=true;
    };
    const scroll=()=>{dirty=true;};
    const move=(event:PointerEvent)=>{if(event.pointerType==='touch')return;pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;pointerAge=0;dirty=true;};
    const leave=()=>{pointer.active=false;dirty=true;};
    const visibility=()=>{dirty=true;};
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const mediaChanged=()=>{if(media.matches){states.forEach(finishBuild);fade=0;}dirty=true;};
    const tick=(time:number,delta:number)=>{
      if(disposed||document.hidden||time-lastPaint<1/40)return;
      const isStill=latest.current.reduced||media.matches;
      const animating=states.some(s=>s.phase==='active'&&s.lane>=0);
      const done=states.every(s=>s.phase==='done');
      if(!dirty&&(!animating||latest.current.paused)&&(!done||fade===0)&&(!pointer.active||pointerAge>80))return;
      const dt=Math.min(.05,Math.max(0,time-lastPaint));lastPaint=time;dirty=false;pointerAge++;
      const visible=new Set<number>(),atBottom=window.scrollY+height>=document.documentElement.scrollHeight-3;
      // Read layout first; canvas and cursor writes happen only after this pass.
      pieces.forEach((piece,index)=>{
        piece.box=measurePiece(piece);
        if(!piece.element.isConnected||!piece.element.getClientRects().length){finishBuild(piece.state);return;}
        if(needsGlyphs&&piece.state.kind==='text')piece.glyphs=measureGlyphs(piece.element);
        if(isStill){finishBuild(piece.state);return;}
        if(visibleBox(piece.box,width,height)||(atBottom&&piece.box.y<height&&piece.box.y+piece.box.height>40&&piece.box.width>1))visible.add(index);
        else if(!latest.current.paused&&piece.box.y+piece.box.height<35)finishBuild(piece.state);
      });needsGlyphs=false;
      if(isStill)fade=0;else advanceBuild(states,visible,dt,latest.current.speed,latest.current.paused);
      const allDone=states.every(s=>s.phase==='done');
      if(allDone&&!latest.current.paused)fade=Math.max(0,fade-dt*1.8);
      paintMask(ctx,pieces,regions,backdrops,width,height,bg,fade);
      if(!isStill)paintRulers(ctx,width,height,window.scrollY);
      const active=pieces.filter((piece,index)=>piece.state.phase==='active'&&piece.state.lane>=0&&visible.has(index));
      const occupied=new Set<number>();
      for(const piece of active){
        const lane=piece.state.lane;occupied.add(lane);
        const target=paintSelection(ctx,piece,width,height),tip=fitCursor(target.x,target.y,width,height);
        const position=tips[lane],blend=latest.current.paused?1:.25;
        position.x+=(tip.x-position.x)*blend;position.y+=(tip.y-position.y)*blend;
        const cursor=cursors[lane];if(cursor){cursor.style.opacity='1';cursor.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;cursor.dataset.tool=piece.state.kind;const label=cursor.querySelector('span'),text=piece.state.kind==='text'?'排字':piece.state.kind==='media'?'放图':'对齐';if(label&&label.textContent!==text)label.textContent=text;}
      }
      cursors.forEach((cursor,index)=>{
        if(occupied.has(index))return;
        if(active.length===0&&pointer.active&&!isStill&&!latest.current.paused&&pointerAge<80){
          const tip=fitCursor(pointer.x-35-index*26,pointer.y+22+index*19,width,height),position=tips[index];
          position.x+=(tip.x-position.x)*.08;position.y+=(tip.y-position.y)*.08;cursor.style.opacity='.85';cursor.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;
        }else cursor.style.opacity='0';
      });
      publish(active.length);
    };
    const safeTick=(time:number,delta:number)=>{try{tick(time,delta);}catch{ctx.clearRect(0,0,width,height);cursors.forEach(cursor=>cursor.style.opacity='0');setFailed(true);gsap.ticker.remove(safeTick);}};
    resize();publish();wake.current=()=>{dirty=true;};
    window.addEventListener('resize',resize);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',leave);
    document.addEventListener('visibilitychange',visibility);media.addEventListener('change',mediaChanged);
    document.fonts.ready.then(()=>{if(!disposed){needsGlyphs=true;dirty=true;}});
    gsap.ticker.add(safeTick);
    return()=>{disposed=true;gsap.ticker.remove(safeTick);wake.current=()=>{};window.removeEventListener('resize',resize);window.removeEventListener('scroll',scroll);window.removeEventListener('pointermove',move);window.removeEventListener('blur',leave);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',mediaChanged);ctx.clearRect(0,0,width,height);};
  },{scope:root,dependencies:[replay,reduced],revertOnUpdate:true});
  useEffect(()=>{wake.current();},[paused,speed]);

  return createPortal(<div ref={root} className="swarm-rebuild" data-swarm-active role="dialog" aria-modal="true" aria-labelledby="swarm-title" aria-describedby="swarm-description">
    <canvas ref={canvas} className="swarm-veil" aria-hidden="true"/>
    <div className="swarm-cursors" aria-hidden="true">{['排字','图像','排版'].map((label,index)=><div className={'swarm-cursor swarm-cursor-'+index} data-swarm-cursor={index} key={label}><Icon name="cursor-bold" size={23}/><span>{label}</span></div>)}</div>
    <div className="swarm-mode-label"><span id="swarm-title">光标接管</span><p id="swarm-description">按现有页面模拟搭建</p><a href="https://github.com/DhvanilPatel/swarm-cursors" target="_blank" rel="noreferrer">灵感：Swarm Rebuild</a><a className="swarm-original-credit" href="https://califa.github.io/swarm-site/" target="_blank" rel="noreferrer">原作：Joel Califa</a></div>
    <div className="swarm-controls" role="group" aria-label="搭建演示控制">
      <div className="swarm-status"><span className="swarm-status-dot"/><div><strong>{failed?'演示暂不可用':reduced?'静态浏览':complete?'已经搭好':paused?'已暂停':report.active?'正在搭建':'下滑，接着搭'}</strong><span aria-live="polite">{failed?'可以直接返回网页':`${report.done} / ${report.total} 件已就位`}</span></div></div>
      <div className="swarm-progress" role="progressbar" aria-label="已放入的页面内容" aria-valuemin={0} aria-valuemax={report.total||1} aria-valuenow={report.done}><i style={{transform:`scaleX(${report.total?report.done/report.total:0})`}}/></div>
      <div className="swarm-control-actions">
        {!reduced&&!failed&&<><button type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={paused} aria-label={paused?'继续搭建演示':'暂停搭建演示'}>{paused?'继续':'暂停'}</button><button type="button" className="swarm-speed" onClick={()=>setSpeed(value=>value===2?1:2)} aria-label={`演示速度 ${speed} 倍，点击切换`}>{speed}×</button><button type="button" className="swarm-replay" onClick={()=>{setPaused(false);setReplay(value=>value+1);}} aria-label="重播搭建演示"><Icon name="refresh-linear" size={17}/><span>重播</span></button></>}
        <button ref={exit} type="button" className="swarm-exit" onClick={close}>回到网页<Icon name="arrow-right-up-linear" size={17}/><kbd>Esc</kbd></button>
      </div>
    </div>
  </div>,document.body);
}
