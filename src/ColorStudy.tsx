import { useRef, type PointerEvent } from 'react';

/** The same original render in two treatments: contact uncovers its colour. */
export function ColorStudy({src,alt,reduced=false}:{src:string;alt:string;reduced?:boolean}) {
  const root=useRef<HTMLDivElement>(null);
  const move=(event:PointerEvent<HTMLDivElement>)=>{
    if(reduced||event.pointerType!=='mouse')return;
    const rect=event.currentTarget.getBoundingClientRect();
    root.current?.style.setProperty('--lens-x',`${(event.clientX-rect.left)/rect.width*100}%`);
    root.current?.style.setProperty('--lens-y',`${(event.clientY-rect.top)/rect.height*100}%`);
  };
  return <div ref={root} className={`color-study ${reduced?'is-still':''}`} onPointerMove={move}>
    <img className="color-study-print" src={src} alt={alt} loading="lazy" decoding="async"/>
    <img className="color-study-reveal" src={src} alt="" aria-hidden="true" loading="lazy" decoding="async"/>
  </div>;
}
