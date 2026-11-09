import {useCallback,useEffect,useRef} from 'react';
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

/** Opening reconstruction over the live page. Escape hands control back immediately. */
export default function SwarmRebuild({reduced,onClose}:Props){
  const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const latest=useRef({reduced,onClose});latest.current={reduced,onClose};
  const close=useCallback(()=>latest.current.onClose(),[]);

  useEffect(()=>{
    const page=document.getElementById('root'),wasInert=page?.inert||false;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    if(page)page.inert=true;
    root.current?.focus({preventScroll:true});
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return;}
      if(event.key==='Tab'){
        // The transient hint is never a tab stop. The persistent exit appears on focus.
        const button=root.current?.querySelector<HTMLButtonElement>('.swarm-skip');
        event.preventDefault();button?.focus({preventScroll:true});
      }
    };
    window.addEventListener('keydown',key,true);
    return()=>{
      window.removeEventListener('keydown',key,true);if(page)page.inert=wasInert;
      const usable=previous?.isConnected&&previous!==document.body&&previous!==document.documentElement&&!previous.closest('dialog,[inert]');
      const target=usable?previous:document.querySelector<HTMLElement>('.wordmark');
      if(document.hasFocus())target?.focus({preventScroll:true});
    };
  },[close]);

  useGSAP(()=>{
    if(reduced)return;
    gsap.timeline({defaults:{ease:'power3.out'}})
      .fromTo('.swarm-hint',{autoAlpha:0,y:14},{autoAlpha:1,y:0,duration:.7},.3)
      .fromTo('.swarm-hint-key',{rotation:-18,scale:.85},{rotation:-7,scale:1,duration:1,ease:'back.out(1.5)'},.3)
      .fromTo('.swarm-hint-trail path',{strokeDashoffset:1},{strokeDashoffset:0,duration:1.2},.45)
      .to('.swarm-hint',{autoAlpha:0,y:-9,duration:.85,ease:'power2.inOut'},4.6);
  },{scope:root,dependencies:[reduced],revertOnUpdate:true});

  useGSAP(()=>{
    const surface=canvas.current,host=document.querySelector<HTMLElement>('.space-app');
    if(reduced||!surface||!host){close();return;}
    const ctx=surface.getContext('2d');if(!ctx){close();return;}
    let disposed=false,dirty=true,lastPaint=0,needsGlyphs=true;
    let width=innerWidth,height=innerHeight,bg='#030712',fade=1,pointerAge=0;
    const pieces=collectBlueprint(host),states=pieces.map(piece=>piece.state),regions=new Map<HTMLElement,Piece[]>();
    if(!pieces.length){close();return;}
    const backdrops=Array.from(host.querySelectorAll<HTMLElement>('.editorial-world,.contact-finale')).map(element=>({element,color:getComputedStyle(element).backgroundColor}));
    pieces.forEach(piece=>regions.set(piece.region,[...(regions.get(piece.region)||[]),piece]));
    const cursors=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-swarm-cursor]')||[]);
    const pointer={x:width*.55,y:height*.45,active:false};
    const tips=Array.from({length:3},(_,i)=>({x:width/2+(i-1)*42,y:height/2}));
    const palette=()=>{
      bg=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#030712';
      backdrops.forEach(backdrop=>{backdrop.color=getComputedStyle(backdrop.element).backgroundColor;});
      dirty=true;
    };
    const resize=()=>{
      width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);
      surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      palette();
      dirty=true;needsGlyphs=true;
    };
    const scroll=()=>{dirty=true;};
    const move=(event:PointerEvent)=>{if(event.pointerType==='touch')return;pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;pointerAge=0;dirty=true;};
    const leave=()=>{pointer.active=false;dirty=true;};
    const visibility=()=>{lastPaint=gsap.ticker.time;dirty=true;};
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const mediaChanged=()=>{if(media.matches)close();};
    const tick=(time:number)=>{
      if(disposed||document.hidden||time-lastPaint<1/40)return;
      if(latest.current.reduced||media.matches){close();return;}
      const animating=states.some(s=>s.phase==='active'&&s.lane>=0);
      const done=states.every(s=>s.phase==='done');
      if(!dirty&&!animating&&!done&&(!pointer.active||pointerAge>80))return;
      const dt=Math.min(.05,Math.max(0,time-lastPaint));lastPaint=time;dirty=false;pointerAge++;
      const visible=new Set<number>();
      // Read layout first; canvas and cursor writes happen only after this pass.
      pieces.forEach((piece,index)=>{
        piece.box=measurePiece(piece);
        if(!piece.element.isConnected||!piece.element.getClientRects().length){finishBuild(piece.state);return;}
        if(needsGlyphs&&piece.state.kind==='text')piece.glyphs=measureGlyphs(piece.element);
        if(visibleBox(piece.box,width,height))visible.add(index);
        else if(piece.box.y+piece.box.height<24)finishBuild(piece.state);
      });needsGlyphs=false;
      advanceBuild(states,visible,dt);
      const allDone=states.every(s=>s.phase==='done');
      if(allDone)fade=Math.max(0,fade-dt*1.8);
      paintMask(ctx,pieces,regions,backdrops,width,height,bg,fade);
      if(fade===0){close();return;}
      ctx.globalAlpha=fade;paintRulers(ctx,width,height,window.scrollY);ctx.globalAlpha=1;
      const active=pieces.filter((piece,index)=>piece.state.phase==='active'&&piece.state.lane>=0&&visible.has(index));
      const occupied=new Set<number>();
      for(const piece of active){
        const lane=piece.state.lane;occupied.add(lane);
        const target=paintSelection(ctx,piece,width,height),tip=fitCursor(target.x,target.y,width,height);
        const position=tips[lane];position.x+=(tip.x-position.x)*.25;position.y+=(tip.y-position.y)*.25;
        const cursor=cursors[lane];if(cursor){cursor.style.opacity='1';cursor.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;cursor.dataset.tool=piece.state.kind;const label=cursor.querySelector('span'),text=piece.state.kind==='text'?'排字':piece.state.kind==='media'?'放图':'对齐';if(label&&label.textContent!==text)label.textContent=text;}
      }
      cursors.forEach((cursor,index)=>{
        if(occupied.has(index))return;
        if(active.length===0&&pointer.active&&pointerAge<80){
          const tip=fitCursor(pointer.x-35-index*26,pointer.y+22+index*19,width,height),position=tips[index];
          position.x+=(tip.x-position.x)*.08;position.y+=(tip.y-position.y)*.08;cursor.style.opacity=String(.85*fade);cursor.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;
        }else cursor.style.opacity='0';
      });
    };
    const safeTick=(time:number)=>{try{tick(time);}catch{ctx.clearRect(0,0,width,height);gsap.ticker.remove(safeTick);close();}};
    resize();
    // Cover the live page before the first paint, without waiting for a lazy chunk.
    paintMask(ctx,pieces,regions,backdrops,width,height,bg,fade);
    const layout=new ResizeObserver(()=>{dirty=true;needsGlyphs=true;});layout.observe(host);
    // App restores its saved theme after the first layout pass.
    const themeObserver=new MutationObserver(palette);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    window.addEventListener('resize',resize);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',leave);
    document.addEventListener('visibilitychange',visibility);media.addEventListener('change',mediaChanged);
    document.fonts.ready.then(()=>{if(!disposed){needsGlyphs=true;dirty=true;}});
    gsap.ticker.add(safeTick);
    return()=>{disposed=true;layout.disconnect();themeObserver.disconnect();gsap.ticker.remove(safeTick);window.removeEventListener('resize',resize);window.removeEventListener('scroll',scroll);window.removeEventListener('pointermove',move);window.removeEventListener('blur',leave);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',mediaChanged);ctx.clearRect(0,0,width,height);};
  },{scope:root,dependencies:[reduced,close],revertOnUpdate:true});

  return createPortal(<div ref={root} className="swarm-rebuild" data-swarm-active role="dialog" aria-modal="true" aria-labelledby="swarm-title" aria-describedby="swarm-description" tabIndex={-1}>
    <h2 id="swarm-title" className="swarm-sr-only">光标接管</h2>
    <p id="swarm-description" className="swarm-sr-only">正在模拟搭建页面。向下滚动继续观看；按 Esc 随时退出，或按 Tab 找到跳过按钮。</p>
    <canvas ref={canvas} className="swarm-veil" aria-hidden="true"/>
    <div className="swarm-cursors" aria-hidden="true">{['排字','图像','排版'].map((label,index)=><div className={'swarm-cursor swarm-cursor-'+index} data-swarm-cursor={index} key={label}><Icon name="cursor-bold" size={23}/><span>{label}</span></div>)}</div>
    <div className="swarm-hint" aria-hidden="true">
      <span className="swarm-hint-key">esc<span>↖</span></span>
      <svg className="swarm-hint-trail" viewBox="0 0 78 50" fill="none"><path d="M3 29C18 3 29 3 39 24S59 49 74 22M64 26L74 22L75 32" pathLength="1"/></svg>
      <span className="swarm-hint-copy"><span>随时接手</span><small className="swarm-hint-desktop">按 Esc 退出</small><small className="swarm-hint-touch">轻点右上角，跳过</small></span>
    </div>
    <button type="button" className="swarm-skip" onClick={close} aria-label="退出光标接管，回到网页"><span>跳过</span><Icon name="arrow-right-up-linear" size={16}/></button>
  </div>,document.body);
}
