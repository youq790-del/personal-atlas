import fs from 'node:fs/promises';
import { buildSurfacePoster } from '../src/sculpture/surface.ts';

// An original mathematical diagram, generated from the same model as the hero.
const model=buildSurfacePoster(.9);
const output=new URL('../public/assets/surface/saddle.svg',import.meta.url);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="980" height="660" viewBox="0 0 980 660" role="img" aria-labelledby="title desc"><title id="title">弯一点。</title><desc id="desc">由 z=a(x²−y²) 生成的双曲抛物面示意，不是材料仿真。</desc><defs><linearGradient id="satin" x1="12%" y1="12%" x2="82%" y2="92%"><stop stop-color="#ffd8b9"/><stop offset=".46" stop-color="#f29277"/><stop offset="1" stop-color="#d95a60"/></linearGradient><clipPath id="surface"><path d="${model.outline}"/></clipPath></defs><rect width="980" height="660" fill="#101746"/><path d="${model.outline}" fill="#5164c2" transform="translate(0 7)"/><path d="${model.outline}" fill="url(#satin)" stroke="#eba890"/><g clip-path="url(#surface)" fill="none" stroke="#963e55"><path d="${model.parameterLines.join(' ')}" stroke-width=".65" opacity=".3"/><path d="${model.contourLines.join(' ')}" stroke-width=".7" opacity=".4"/></g></svg>`;
await fs.mkdir(new URL('.',output),{recursive:true});
await fs.writeFile(output,svg+'\n');
console.log('Generated the static sculpture diagram.');
