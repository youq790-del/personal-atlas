import {clamp01,revealProgress,type Box} from './model';
import type {Piece} from './blueprint';

export const cursorColors=['#579bff','#ff987b','#c0a1ff'];
export type Backdrop={element:HTMLElement;color:string};
export function clearWindow(ctx:CanvasRenderingContext2D,box:Box,p=1){
  ctx.fillRect(box.x-2,box.y-2,(box.width+4)*p,box.height+4);
}

/** Paint only the temporary UI mask; transparent windows show the live page. */
export function paintMask(ctx:CanvasRenderingContext2D,pieces:Piece[],regions:Map<HTMLElement,Piece[]>,backdrops:Backdrop[],width:number,height:number,background:string,opacity:number){
  ctx.clearRect(0,0,width,height);
  if(opacity<=0)return;
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=opacity;
  ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
  for(const backdrop of backdrops){const r=backdrop.element.getBoundingClientRect();ctx.fillStyle=backdrop.color;ctx.fillRect(r.left,r.top,r.width,r.height);}
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';
  for(const [region,items] of regions){
    if(items.every(piece=>piece.state.phase==='done')){
      const r=region.getBoundingClientRect();clearWindow(ctx,{x:r.left,y:r.top,width:r.width,height:r.height});
    }
  }
  for(const piece of pieces){
    const b=piece.box;if(b.y>height||b.y+b.height<0)continue;
    const p=revealProgress(piece.state);if(p<=0)continue;
    if(p>=1)clearWindow(ctx,b);
    else if(piece.state.kind==='text'&&piece.glyphs.length){
      for(const rects of piece.glyphs.slice(0,Math.floor(piece.glyphs.length*p))){for(const r of rects)ctx.fillRect(b.x+r.x,b.y+r.y,r.width,r.height);}
    }else if(piece.state.kind==='media'){
      // The first part is the frame being dragged; then live media fills it.
      clearWindow(ctx,b,clamp01((p-.23)/.77));
    }else clearWindow(ctx,b,p);
  }
  ctx.globalCompositeOperation='source-over';
}

export function paintSelection(ctx:CanvasRenderingContext2D,piece:Piece,width:number,height:number):{x:number;y:number}{
  const b=piece.box,p=revealProgress(piece.state),color=cursorColors[Math.max(0,piece.state.lane)];
  const easing=1-Math.pow(1-p,3);
  const rect=piece.state.kind==='media'?{x:b.x+(1-easing)*55,y:b.y+(1-easing)*22,width:b.width*(.85+.15*easing),height:b.height*(.85+.15*easing)}:b;
  if(piece.state.kind==='media'&&!piece.scene&&p<.72){
    // A transient drag preview uses only an already-decoded image/video on this page.
    // No pixels are exported and no new media request is made.
    const video=piece.element.querySelector<HTMLVideoElement>('video.has-frame');
    const image=piece.element.querySelector<HTMLImageElement>('img');
    const media=video&&video.readyState>=2?video:image?.complete&&image.naturalWidth?image:null;
    if(media){
      const mw=media instanceof HTMLVideoElement?media.videoWidth:media.naturalWidth,mh=media instanceof HTMLVideoElement?media.videoHeight:media.naturalHeight;
      const scale=Math.min(rect.width/Math.max(1,mw),rect.height/Math.max(1,mh));
      ctx.globalAlpha=(1-p/.72)*.85;
      try{ctx.drawImage(media,rect.x+(rect.width-mw*scale)/2,rect.y+(rect.height-mh*scale)/2,mw*scale,mh*scale);}catch{/* Live window is the fallback for unavailable media. */}
      ctx.globalAlpha=1;
    }
  }
  ctx.strokeStyle=color;ctx.lineWidth=1;ctx.globalAlpha=.8;
  ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(rect.x,25);ctx.lineTo(rect.x,Math.min(height-90,rect.y+rect.height+20));ctx.stroke();ctx.setLineDash([]);
  ctx.strokeRect(rect.x-.5,rect.y-.5,rect.width+1,rect.height+1);
  ctx.fillStyle='#101729';
  for(const [x,y] of [[rect.x,rect.y],[rect.x+rect.width,rect.y],[rect.x,rect.y+rect.height],[rect.x+rect.width,rect.y+rect.height]]){ctx.fillRect(x-3,y-3,6,6);ctx.strokeRect(x-3,y-3,6,6);}
  ctx.globalAlpha=1;
  const label=`${piece.scene?'场景区域 · ':''}${Math.round(b.width)} × ${Math.round(b.height)}`;
  ctx.font='10px sans-serif';const labelWidth=ctx.measureText(label).width+15;
  const lx=Math.max(5,Math.min(width-labelWidth-8,rect.x+rect.width-labelWidth)),ly=Math.max(29,Math.min(height-108,rect.y+rect.height+8));
  ctx.fillStyle='#101729';ctx.fillRect(lx,ly,labelWidth,22);ctx.fillStyle=color;ctx.fillText(label,lx+7,ly+15);
  if(piece.state.kind==='text'&&piece.glyphs.length){
    const glyph=piece.glyphs[Math.max(0,Math.min(piece.glyphs.length-1,Math.floor(p*piece.glyphs.length)-1))];const r=glyph?.at(-1);
    if(r){const x=b.x+r.x+r.width,y=b.y+r.y;ctx.fillStyle=color;ctx.fillRect(x,y,1.5,r.height);return {x:x+10,y:y+r.height*.55};}
  }
  return {x:rect.x+rect.width*Math.min(1,p*1.7),y:rect.y+rect.height*Math.min(1,p*1.7)};
}

export function paintRulers(ctx:CanvasRenderingContext2D,width:number,height:number,scroll:number){
  ctx.fillStyle='#101729';ctx.fillRect(0,0,width,22);ctx.fillRect(0,22,22,height-22);
  ctx.strokeStyle='#586681';ctx.fillStyle='#b6c6df';ctx.font='8px sans-serif';ctx.lineWidth=1;
  ctx.beginPath();for(let x=30;x<width;x+=10){const major=(x-30)%100===0;ctx.moveTo(x,major?11:17);ctx.lineTo(x,22);if(major)ctx.fillText(String(x-30),x+3,9);}ctx.stroke();
  ctx.beginPath();const start=30-scroll%100;for(let y=start;y<height-85;y+=10){if(y<30)continue;const major=Math.round((y-start)/10)%10===0;ctx.moveTo(major?11:17,y);ctx.lineTo(22,y);if(major){ctx.save();ctx.translate(8,y-2);ctx.rotate(-Math.PI/2);ctx.fillText(String(Math.round((y+scroll-30)/100)*100),0,0);ctx.restore();}}ctx.stroke();
}
