import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);
const OPEN = 'M0 156 C95 152 115 22 245 54 C365 84 390 184 510 112 C655 20 710 28 800 75 C890 122 950 102 1000 36 L1000 201 L0 201 Z';
const FLAT = 'M0 198 C95 198 115 198 245 198 C365 198 390 198 510 198 C655 198 710 198 800 198 C890 198 950 198 1000 198 L1000 201 L0 201 Z';

/** A geometric page seam: the next opaque chapter physically covers the scene. */
export function SeamTransition({reduced}:{reduced:boolean}) {
  const root = useRef<SVGSVGElement>(null);
  useGSAP(() => {
    if(reduced || !root.current) return;
    gsap.fromTo(root.current.querySelector('path'), {attr:{d:OPEN}}, {
      attr:{d:FLAT}, ease:'none',
      scrollTrigger:{trigger:root.current.closest('#experience')!,start:'top bottom',end:'top 8%',scrub:true,invalidateOnRefresh:true},
    });
  }, {scope:root,dependencies:[reduced],revertOnUpdate:true});
  return <svg ref={root} className="chapter-seam" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><path d={reduced?FLAT:OPEN}/></svg>;
}
