import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';

export function ElasticText({text,className=''}:{text:string;className?:string}) {
  return <span className={`elastic-text ${className}`} aria-label={text}>{Array.from(text).map((letter,i)=><span className="elastic-letter" aria-hidden="true" key={i}><span className="elastic-ink">{letter===' '?' ':letter}</span></span>)}</span>;
}

export function ElasticLine({className=''}:{className?:string}) {
  return <svg className={`elastic-line ${className}`} viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 Q500 40 1000 40"/></svg>;
}

/** Exact geometric studies, not stand-in project screenshots. */
export function KineticArtwork({variant=0}:{variant?:number}) {
  const mode=variant%4;
  return <svg className={`kinetic-artwork art-${mode}`} viewBox="0 0 600 420" aria-hidden="true" data-kinetic="art"><g transform="translate(300 210)" fill="none" stroke="currentColor" strokeWidth="1.2">{Array.from({length:22},(_,i)=>mode===0?<ellipse key={i} rx={90+i*3.6} ry={140-i*4.8} transform={`rotate(${i*8.2})`}/>:mode===1?<rect key={i} x={-125+i*3.4} y={-125+i*3.4} width={250-i*6.8} height={250-i*6.8} rx="6" transform={`rotate(${i*4.3})`}/>:mode===2?<path key={i} d={`M-220 ${-140+i*13} C-100 ${-220+i*12} -70 ${170-i*8} 0 ${-65+i*7} S130 ${-70+i*3} 220 ${-95+i*13}`}/>:<ellipse key={i} cx={Math.cos(i*.43)*54} cy={Math.sin(i*.43)*54} rx={85+i*2} ry={85+i*2}/>)}</g></svg>;
}

type Body={el:HTMLElement;ink:HTMLElement;x:number;y:number;vx:number;vy:number;rect:DOMRect;glyph:boolean};
const clamp=(a:number,b:number,v:number)=>Math.max(a,Math.min(b,v));

/** One bounded spring field. Layout slots stay still, only their visual skin moves. */
export function useKineticSurface(root:RefObject<HTMLElement|null>,disabled:boolean,key:string) {
  useEffect(()=>{
    if(disabled||!root.current)return;
    const host=root.current;
    const pointer={x:-1000,y:-1000,active:false};
    let bodies:Body[]=[],lines:{el:SVGSVGElement;path:SVGPathElement;rect:DOMRect;y:number;v:number}[]=[];
    let dirty=true,energy=0,lastY=window.scrollY,lastTime=performance.now(),awake=0;
    const gather=()=>{
      bodies=Array.from(host.querySelectorAll<HTMLElement>('.elastic-letter,[data-kinetic],.site-header button,.site-header a,.hero-utilities button,.scroll-invitation,.editorial-link,.skill-controls button,.filters button,.row-toggle,.project-preview,footer button,main p,.hero-role,.profile-note,.skill-readout strong,.experience-category,.story-context,.project-caption')).filter(el=>!el.closest('dialog')).map(el=>({el,ink:el.querySelector<HTMLElement>('.elastic-ink')||el,x:0,y:0,vx:0,vy:0,rect:el.getBoundingClientRect(),glyph:el.classList.contains('elastic-letter')}));
      lines=Array.from(host.querySelectorAll<SVGSVGElement>('.elastic-line')).map(el=>({el,path:el.querySelector('path')!,rect:el.getBoundingClientRect(),y:0,v:0}));dirty=true;awake=80;
    };
    const move=(e:PointerEvent)=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=e.pointerType!=='touch';dirty=true;awake=80;};
    const leave=()=>{pointer.active=false;awake=80;};
    const scroll=()=>{const now=performance.now();energy=clamp(-1,1,(window.scrollY-lastY)/Math.max(16,now-lastTime)/2.5);lastY=window.scrollY;lastTime=now;dirty=true;awake=80;};
    const measure=()=>{dirty=true;awake=80;};
    gather();
    const resize=new ResizeObserver(measure);resize.observe(host);
    const tick=(_time:number,delta:number)=>{
      if(document.hidden||awake<=0)return;
      awake--;const dt=Math.min(2,delta/16.667);
      if(dirty){bodies.forEach(b=>b.rect=b.el.getBoundingClientRect());lines.forEach(l=>l.rect=l.el.getBoundingClientRect());dirty=false;}
      const blocked=!!document.querySelector('dialog[open],.opening-sequence');
      energy*=Math.pow(.88,dt);
      for(const b of bodies){
        const r=b.rect;if(r.bottom<0||r.top>innerHeight)continue;
        const dx=pointer.x-r.left-r.width/2,dy=pointer.y-r.top-r.height/2;
        const reach=b.glyph?Math.max(90,r.height*1.1):Math.max(90,Math.min(180,r.width/2+40));
        const distance=Math.hypot(dx,dy);const force=pointer.active&&!blocked?Math.max(0,1-distance/reach):0;
        const tx=b.glyph?-dx*force*.27:dx*force*.09;
        const ty=(b.glyph?-dy*force*.3:dy*force*.1)+energy*(b.glyph?10:5);
        b.vx+=(tx-b.x)*.14*dt;b.vy+=(ty-b.y)*.14*dt;b.vx*=Math.pow(.69,dt);b.vy*=Math.pow(.69,dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
        if(b.glyph){b.ink.style.transform=`translate3d(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px,0) scale(${(1+force*.2-Math.abs(energy)*.025).toFixed(3)},${(1-force*.14+Math.abs(energy)*.09).toFixed(3)}) skewX(${(energy*-5+force*dx*.045).toFixed(2)}deg)`;}
        else{b.ink.style.translate=`${b.x.toFixed(2)}px ${b.y.toFixed(2)}px`;b.ink.style.rotate=`${(energy*-.7+force*dx*.006).toFixed(2)}deg`;b.ink.style.scale=`${(1-Math.abs(energy)*.009).toFixed(3)} ${(1+Math.abs(energy)*.035).toFixed(3)}`;}
      }
      for(const l of lines){
        const r=l.rect;if(r.bottom<0||r.top>innerHeight)continue;
        const close=pointer.active&&!blocked&&pointer.x>=r.left&&pointer.x<=r.right&&Math.abs(pointer.y-r.top-r.height/2)<85;
        const target=(close?clamp(-45,45,(pointer.y-r.top-r.height/2)*1.1):0)+energy*24;
        l.v+=(target-l.y)*.12*dt;l.v*=Math.pow(.72,dt);l.y+=l.v*dt;
        const x=close?clamp(70,930,(pointer.x-r.left)/r.width*1000):500;
        l.path.setAttribute('d',`M0 40 Q${x.toFixed(1)} ${(40+l.y).toFixed(2)} 1000 40`);
      }
    };
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerout',leave);window.addEventListener('blur',leave);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',measure);gsap.ticker.add(tick);
    return()=>{resize.disconnect();gsap.ticker.remove(tick);window.removeEventListener('pointermove',move);window.removeEventListener('pointerout',leave);window.removeEventListener('blur',leave);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',measure);bodies.forEach(b=>{if(b.glyph)b.ink.style.removeProperty('transform');else{b.ink.style.removeProperty('translate');b.ink.style.removeProperty('rotate');b.ink.style.removeProperty('scale');}});lines.forEach(l=>l.path.setAttribute('d','M0 40 Q500 40 1000 40'));};
  },[root,disabled,key]);
}

/** A projected, spring-linked particle torus. Pointer and scrolling supply its energy. */
export function ParticleField({disabled}:{disabled:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(disabled||!canvas.current)return;
    const el=canvas.current,ctx=el.getContext('2d');if(!ctx)return;
    let w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5),lastY=scrollY,velocity=0,awake=160,dirty=true;
    let phase=0,last=0;const p={x:-1000,y:-1000,active:false};
    const dots=Array.from({length:innerWidth<768?240:620},(_,i)=>({u:(i%31)/31*Math.PI*2,v:Math.floor(i/31)/20*Math.PI*2,x:0,y:0,vx:0,vy:0,size:1.1+(i%5)*.32}));
    const size=()=>{w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio,1.5);el.width=w*dpr;el.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;awake=120;};
    const pointer=(e:PointerEvent)=>{p.x=e.clientX;p.y=e.clientY;p.active=e.pointerType!=='touch';awake=100;};
    const leave=()=>{p.active=false;awake=80;};
    const scroll=()=>{velocity=clamp(-28,28,scrollY-lastY);lastY=scrollY;awake=100;};
    const theme=()=>{dirty=true;awake=90;};const observer=new MutationObserver(theme);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    size();
    const tick=(time:number)=>{
      if(document.hidden||time-last<1/35)return;last=time;if(awake<=0&&!dirty)return;awake--;dirty=false;
      const hero=document.getElementById('hero')?.getBoundingClientRect();const contact=document.getElementById('contact')?.getBoundingClientRect();
      const ending=!!contact&&contact.top<h;const visible=(hero?.bottom??0)>0||ending;
      ctx.clearRect(0,0,w,h);if(!visible)return;
      phase+=.0015+Math.abs(velocity)*.0006;velocity*=.9;
      const light=document.documentElement.dataset.theme==='light';
      const cx=ending?w*.53:w*(w<768?.53:.7),cy=ending?h*.77:h*(w<768?.65:.49);
      const radius=Math.min(w*(w<768?.4:.28),h*.46);
      ctx.fillStyle=ending?(light?'#375b50':'#bcecd5'):(light?'#608676':'#9bc9b7');
      for(const dot of dots){
        const u=dot.u+phase,v=dot.v;const ring=1+.31*Math.cos(v);
        const x=Math.cos(u)*ring,y=Math.sin(u)*ring*.56+Math.sin(v)*.25,z=Math.sin(u)*.4+Math.sin(v)*.3;
        const tx=cx+x*radius,ty=cy+y*radius*(1+Math.abs(velocity)*.008);
        const dx=tx+dot.x-p.x,dy=ty+dot.y-p.y,dist=Math.hypot(dx,dy);
        if(p.active&&dist<125){const force=(1-dist/125)*1.7;dot.vx+=dx/Math.max(1,dist)*force;dot.vy+=dy/Math.max(1,dist)*force;}
        dot.vx-=dot.x*.018;dot.vy-=dot.y*.018;dot.vx*=.88;dot.vy*=.88;dot.x+=dot.vx;dot.y+=dot.vy;
        ctx.globalAlpha=(ending?.58:.28)*(z+1.1)/1.8;ctx.beginPath();ctx.arc(tx+dot.x,ty+dot.y,dot.size*(z+1.3),0,Math.PI*2);ctx.fill();
      }ctx.globalAlpha=1;
    };
    window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('pointerout',leave);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',size);gsap.ticker.add(tick);
    return()=>{observer.disconnect();gsap.ticker.remove(tick);window.removeEventListener('pointermove',pointer);window.removeEventListener('pointerout',leave);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',size);};
  },[disabled]);
  return disabled?null:<canvas ref={canvas} className="kinetic-field" aria-hidden="true"/>;
}
