import {createBuildState,graphemeOffsets,type Box,type BuildKind,type BuildState} from './model';

type Source = {selector:string;kind:BuildKind;region:string;label:string;scene?:'hero'|'skills'};
export type Piece = {element:HTMLElement;region:HTMLElement;state:BuildState;label:string;box:Box;glyphs:Box[][];scene?:'hero'|'skills'};
const sources:Source[]=[
  {selector:'.site-header .wordmark',kind:'frame',region:'.site-header',label:'标记'},
  {selector:'.hero-copy h1',kind:'text',region:'#hero',label:'名字'},
  {selector:'.hero-role,.hero-manifesto',kind:'text',region:'#hero',label:'介绍'},
  {selector:'.hero-actions',kind:'frame',region:'#hero',label:'入口'},
  {selector:'#hero',kind:'media',region:'#hero',label:'实时键盘',scene:'hero'},
  {selector:'.hero-bottom',kind:'frame',region:'#hero',label:'操作提示'},
  {selector:'.skills-heading h2',kind:'text',region:'#skills',label:'键盘'},
  {selector:'.skills-stage-inner',kind:'media',region:'#skills',label:'实时场景',scene:'skills'},
  {selector:'.skill-readout',kind:'frame',region:'#skills',label:'键位提示'},
  {selector:'.skills-key-index',kind:'frame',region:'#skills',label:'作品键位'},
  {selector:'.portrait-heading h2,.portrait-heading p',kind:'text',region:'#experience',label:'关于我'},
  {selector:'.portrait-perspectives',kind:'frame',region:'#experience',label:'三个侧面'},
  {selector:'.portrait-main-work,.portrait-secondary-work',kind:'media',region:'#experience',label:'图像'},
  {selector:'.portrait-view-copy',kind:'text',region:'#experience',label:'学习笔记'},
  {selector:'#projects > .section-title h2',kind:'text',region:'#projects > .section-title',label:'作品'},
  {selector:'.portfolio-gallery .portfolio-image',kind:'media',region:'.portfolio-piece',label:'动态练习'},
  {selector:'.portfolio-gallery .portfolio-description',kind:'text',region:'.portfolio-piece',label:'作品名'},
  {selector:'.portfolio-writing .reading-room-heading',kind:'text',region:'.portfolio-writing',label:'公众号'},
  {selector:'.portfolio-writing .thinking-desk',kind:'media',region:'.portfolio-writing',label:'问题与观察'},
  {selector:'.portfolio-writing .writing-index-head',kind:'frame',region:'.portfolio-writing',label:'文章目录'},
  {selector:'.portfolio-writing .writing-rows li',kind:'text',region:'.portfolio-writing',label:'笔记'},
  {selector:'.finale-word',kind:'text',region:'#contact',label:'聊聊'},
  {selector:'.finale-contact-button',kind:'frame',region:'#contact',label:'找到我'},
  {selector:'.site-colophon',kind:'frame',region:'.site-colophon',label:'落款'},
];

export function measurePiece(piece:Piece):Box {
  const rect=piece.element.getBoundingClientRect();
  if(piece.scene){
    const small=innerWidth<768;
    if(piece.scene==='hero')return small?{x:rect.left+rect.width*.05,y:rect.top+rect.height*.48,width:rect.width*.9,height:rect.height*.38}:{x:rect.left+rect.width*.50,y:rect.top+rect.height*.14,width:rect.width*.48,height:rect.height*.72};
    return {x:rect.left+rect.width*.08,y:rect.top+rect.height*.24,width:rect.width*.84,height:rect.height*.5};
  }
  return {x:rect.left,y:rect.top,width:rect.width,height:rect.height};
}

/** Geometry only. Original text, events, WebGL and video never leave their DOM. */
export function measureGlyphs(element:HTMLElement):Box[][] {
  const origin=element.getBoundingClientRect(),groups:Box[][]=[];
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
  const range=document.createRange();
  while(walker.nextNode()&&groups.length<180){
    const node=walker.currentNode as Text,parent=node.parentElement;
    if(!parent||parent.closest('script,style,.sr-only,.visually-hidden')||!parent.getClientRects().length)continue;
    for(const {start,end} of graphemeOffsets(node.data)){
      if(groups.length>=180)break;
      range.setStart(node,start);range.setEnd(node,end);
      const rects=Array.from(range.getClientRects()).filter(r=>r.width>0&&r.height>0).map(r=>({x:r.left-origin.left-1,y:r.top-origin.top-1,width:r.width+2,height:r.height+2}));
      if(rects.length)groups.push(rects);
    }
  }
  return groups;
}

export function collectBlueprint(root:HTMLElement):Piece[] {
  const pieces:Piece[]=[],seen=new Set<Element>();
  for(const source of sources){
    for(const element of root.querySelectorAll<HTMLElement>(source.selector)){
      if(seen.has(element)||element.closest('dialog,[hidden]')||!element.getClientRects().length)continue;
      if(source.scene&&root.classList.contains('static-scene'))continue;
      seen.add(element);
      const region=element.matches(source.region)?element:element.closest<HTMLElement>(source.region)||root.querySelector<HTMLElement>(source.region)||element;
      const glyphs=source.kind==='text'?measureGlyphs(element):[];
      const piece:Piece={element,region,state:createBuildState(source.kind,glyphs.length),label:source.label,box:{x:0,y:0,width:0,height:0},glyphs,scene:source.scene};
      piece.box=measurePiece(piece);pieces.push(piece);
    }
  }
  return pieces.sort((a,b)=>{if(a.element===b.element)return 0;return a.element.compareDocumentPosition(b.element)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1;});
}
