import { useId, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import './elastic-frame.css';

type Point = { x: number; y: number };
type SpringPoint = Point & { vx: number; vy: number };
type Props = { children: ReactNode; variant?: number; disabled?: boolean; className?: string; preserveContent?: boolean };

// Each specimen has its own cut, rather than sharing a rounded-card silhouette.
const silhouettes: number[][][] = [
  [[.075,.26],[.27,.075],[.58,.04],[.85,.15],[.95,.38],[.91,.67],[.72,.9],[.42,.96],[.14,.83],[.035,.56]],
  [[.045,.34],[.2,.12],[.48,.045],[.78,.09],[.94,.3],[.955,.61],[.76,.87],[.48,.95],[.2,.9],[.07,.67]],
  [[.065,.22],[.3,.055],[.6,.08],[.88,.23],[.96,.5],[.85,.74],[.62,.94],[.34,.9],[.09,.75],[.035,.48]],
  [[.08,.31],[.26,.08],[.55,.04],[.85,.09],[.96,.34],[.9,.61],[.78,.87],[.47,.95],[.16,.89],[.035,.6]],
  [[.05,.32],[.22,.11],[.5,.045],[.77,.14],[.945,.38],[.92,.7],[.7,.92],[.4,.94],[.12,.8],[.04,.56]],
  [[.1,.22],[.37,.055],[.68,.065],[.91,.23],[.95,.53],[.8,.81],[.57,.95],[.29,.91],[.06,.72],[.045,.44]],
];

function contour(points: Point[]) {
  const f=(value:number)=>value.toFixed(5);
  return points.map((p,i)=>{
    const previous=points[(i-1+points.length)%points.length];
    const next=points[(i+1)%points.length];
    const after=points[(i+2)%points.length];
    const c1={x:p.x+(next.x-previous.x)/6,y:p.y+(next.y-previous.y)/6};
    const c2={x:next.x-(after.x-p.x)/6,y:next.y-(after.y-p.y)/6};
    return `${i===0?`M${f(p.x)},${f(p.y)} `:''}C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(next.x)},${f(next.y)}`;
  }).join(' ')+' Z';
}

/** A fixed layout slot whose actual media silhouette responds like a soft membrane. */
export function ElasticFrame({children,variant=0,disabled=false,className='',preserveContent=false}:Props) {
  const id=`elastic-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
  const root=useRef<HTMLDivElement>(null),clip=useRef<SVGPathElement>(null),line=useRef<SVGPathElement>(null);
  const base=useMemo(()=>silhouettes[((variant%silhouettes.length)+silhouettes.length)%silhouettes.length].map(([x,y])=>({x,y})),[variant]);
  const path=useMemo(()=>contour(base),[base]);

  useGSAP(()=>{
    const element=root.current;
    if(!element)return;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const nodes:SpringPoint[]=base.map(p=>({...p,vx:0,vy:0}));
    let visible=false,running=false,scrollImpulse=0,lastScroll=window.scrollY,lastTime=performance.now(),lastInput=0;
    let pointer={x:.5,y:.5,active:false};
    const enabled=()=>visible&&!document.hidden&&!disabled&&!preference.matches;
    const paint=(d:string)=>{clip.current?.setAttribute('d',d);line.current?.setAttribute('d',d);};
    const stop=()=>{gsap.ticker.remove(tick);running=false;};
    const reset=()=>{
      nodes.forEach((node,i)=>Object.assign(node,base[i],{vx:0,vy:0}));
      scrollImpulse=0;pointer.active=false;paint(path);
    };
    const tick=(_time:number,delta:number)=>{
      const step=Math.min(delta/16.667,2);
      const damping=Math.pow(.77,step);
      let movement=0,distance=0;
      nodes.forEach((node,i)=>{
        const home=base[i];
        const dx=home.x-pointer.x,dy=home.y-pointer.y;
        const contact=pointer.active?Math.exp(-(dx*dx+dy*dy)/.11):0;
        const targetX=Math.max(.018,Math.min(.982,home.x+dx*contact*.2+(home.y-.5)*scrollImpulse*.025));
        const targetY=Math.max(.018,Math.min(.982,home.y+dy*contact*.2+(home.y-.5)*Math.abs(scrollImpulse)*.085));
        node.vx=(node.vx+(targetX-node.x)*.14*step)*damping;
        node.vy=(node.vy+(targetY-node.y)*.14*step)*damping;
        node.x=Math.max(.018,Math.min(.982,node.x+node.vx*step));
        node.y=Math.max(.018,Math.min(.982,node.y+node.vy*step));
        movement+=Math.abs(node.vx)+Math.abs(node.vy);
        distance+=Math.abs(targetX-node.x)+Math.abs(targetY-node.y);
      });
      scrollImpulse*=Math.pow(.88,step);
      if(movement>.000015)paint(contour(nodes));
      if(movement<.00003&&distance<.0001&&Math.abs(scrollImpulse)<.0002&&performance.now()-lastInput>120){
        nodes.forEach(node=>{node.vx=0;node.vy=0;});
        scrollImpulse=0;paint(contour(nodes));stop();
      }
    };
    const wake=()=>{
      if(!enabled())return;
      lastInput=performance.now();
      if(!running){gsap.ticker.add(tick);running=true;}
    };
    const sync=()=>{
      lastScroll=window.scrollY;lastTime=performance.now();
      if(enabled())wake();
      else{stop();reset();}
    };
    const move=(event:PointerEvent)=>{
      if(!enabled())return;
      const bounds=element.getBoundingClientRect();
      pointer={x:(event.clientX-bounds.left)/bounds.width,y:(event.clientY-bounds.top)/bounds.height,active:true};
      wake();
    };
    const press=(event:PointerEvent)=>{
      if(!enabled())return;
      move(event);
      nodes.forEach(node=>{
        const dx=node.x-pointer.x,dy=node.y-pointer.y;
        const contact=Math.exp(-(dx*dx+dy*dy)/.16);
        node.vx+=dx*contact*.025;node.vy+=dy*contact*.025;
      });
    };
    const leave=()=>{if(pointer.active){pointer.active=false;wake();}};
    const scroll=()=>{
      const now=performance.now(),next=window.scrollY;
      if(enabled()&&next!==lastScroll){scrollImpulse=Math.max(-1,Math.min(1,(next-lastScroll)/Math.max(16,now-lastTime)*.42));wake();}
      lastScroll=next;lastTime=now;
    };
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{rootMargin:'70px'});
    observer.observe(element);
    element.addEventListener('pointerenter',move,{passive:true});
    element.addEventListener('pointermove',move,{passive:true});
    element.addEventListener('pointerdown',press,{passive:true});
    element.addEventListener('pointerleave',leave);
    element.addEventListener('pointercancel',leave);
    element.addEventListener('pointerup',leave);
    window.addEventListener('scroll',scroll,{passive:true});
    document.addEventListener('visibilitychange',sync);
    preference.addEventListener('change',sync);
    return()=>{
      observer.disconnect();stop();reset();
      element.removeEventListener('pointerenter',move);element.removeEventListener('pointerdown',press);
      element.removeEventListener('pointermove',move);element.removeEventListener('pointerleave',leave);
      element.removeEventListener('pointercancel',leave);element.removeEventListener('pointerup',leave);
      window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',sync);preference.removeEventListener('change',sync);
    };
  },{scope:root,dependencies:[base,disabled,path],revertOnUpdate:true});

  return <div ref={root} className={`elastic-frame elastic-frame-${variant%6} ${className}`}>
    <svg className="elastic-frame-defs" aria-hidden="true"><defs><clipPath id={id} clipPathUnits="objectBoundingBox"><path ref={clip} d={path}/></clipPath></defs></svg>
    <div className="elastic-frame-surface" style={{clipPath:`url(#${id})`} as CSSProperties}>{!preserveContent&&children}</div>
    {preserveContent&&<div className="elastic-frame-content">{children}</div>}
    <svg className="elastic-frame-contour" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><path ref={line} d={path} vectorEffect="non-scaling-stroke"/></svg>
  </div>;
}
