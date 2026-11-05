import { useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Icon } from './Icon';
import { WeChatShelf } from './WeChatShelf';
import { ElasticFrame } from './ElasticFrame';
import { ColorStudy } from './ColorStudy';
import { WorkFilm } from './WorkFilm';
import type { WeChatCollection } from './wechat';
import { works, workAsset, type PortfolioWork, type WorkId } from './portfolio';

type Props = {work?:PortfolioWork;reading:boolean;collection?:WeChatCollection;reduced:boolean;onClose:()=>void;onWork:(id:WorkId)=>void};
export function WorkStage({work,reading,collection,reduced,onClose,onWork}:Props) {
  const stage=useRef<HTMLDivElement>(null),media=useRef<HTMLDivElement>(null);
  const [zoom,setZoom]=useState(false),[failed,setFailed]=useState(false);
  const active=work?.id||(reading?'writing':'');
  const previousFocus=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    previousFocus.current=document.activeElement as HTMLElement|null;
    // The opening Enter may still be held; focus content, not the close action.
    stage.current?.focus({preventScroll:true});
    const frame=requestAnimationFrame(()=>{
      if(stage.current?.closest('.fallback-skills'))window.scrollTo({top:window.scrollY+stage.current.getBoundingClientRect().top-100,behavior:'instant'});
    });
    return()=>{cancelAnimationFrame(frame);const target=previousFocus.current;if(target?.isConnected)target.focus({preventScroll:true});};
  },[]);
  useEffect(()=>{setZoom(false);setFailed(false);},[active]);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){e.preventDefault();if(zoom)setZoom(false);else onClose();}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[onClose,zoom]);
  useGSAP(()=>{
    if(reduced)return;
    gsap.fromTo('.work-stage-content',{opacity:.4,clipPath:'inset(14% 16% 12% 16%)',y:26},{opacity:1,clipPath:'inset(0% 0% 0% 0%)',y:0,duration:.72,ease:'expo.out',clearProps:'all'});
    const captions=stage.current?.querySelectorAll('.work-stage-caption > *');
    if(captions?.length)gsap.fromTo(captions,{y:18,opacity:0},{y:0,opacity:1,duration:.5,stagger:.045,delay:.16,ease:'expo.out',clearProps:'all'});
  },{scope:stage,dependencies:[active,reduced],revertOnUpdate:true});
  const move=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(reduced||e.pointerType!=='mouse'||!media.current)return;
    if(e.target instanceof Element&&e.target.closest('.work-film-controls')){reset();return;}
    const bounds=e.currentTarget.getBoundingClientRect();
    const x=(e.clientX-bounds.left)/bounds.width,y=(e.clientY-bounds.top)/bounds.height;
    media.current.style.setProperty('--look-x',`${x*100}%`);media.current.style.setProperty('--look-y',`${y*100}%`);
    media.current.style.setProperty('--tilt-x',`${(y-.5)*-3}deg`);media.current.style.setProperty('--tilt-y',`${(x-.5)*4}deg`);
  };
  const reset=()=>{media.current?.style.setProperty('--tilt-x','0deg');media.current?.style.setProperty('--tilt-y','0deg');};
  const index=works.findIndex(item=>item.id===work?.id);
  return <div ref={stage} tabIndex={-1} className={`work-stage ${reading?'work-stage-reading':''} ${zoom?'work-stage-zoom':''}`} style={{'--work-color':work?.color||'#8ba885'} as CSSProperties} role="region" aria-label={reading?'公众号作品':`${work?.title}作品展厅`}>
    <div className="work-stage-content">
      <div className="work-stage-toolbar"><button className="work-back" onClick={()=>{if(zoom)setZoom(false);else onClose();}}><Icon name="arrow-up-linear" size={18}/><span>{zoom?'返回作品':'返回键盘'}</span><kbd>Esc</kbd></button>{work&&<span className="work-medium">{work.motion==='presentation'?'展示运镜':work.video?'动画片段':'Blender 练习'}</span>}</div>
      {reading?<div className="work-reading-scroll" data-lenis-prevent><WeChatShelf collection={collection} reduced={reduced}/></div>:work&&<>
        <div ref={media} className={`work-media ${zoom?'is-magnified':''} ${failed?'media-failed':''}`} onPointerMove={move} onPointerLeave={reset}>
          {work.video?<WorkFilm key={work.id + ':' + work.video} src={workAsset(work.video)} poster={workAsset(work.poster)} title={work.title} reduced={reduced} frameVariant={index} expanded={zoom} onExpand={()=>setZoom(value=>!value)}/>:<>
            <ElasticFrame variant={index} disabled={reduced||zoom} className="work-art-frame" preserveContent>
              {failed?<div className="work-media-error"><Icon name="document-text-linear" size={36}/><p>这幅作品暂时没有加载出来。</p><button className="text-link" onClick={()=>setFailed(false)}>重新加载</button></div>:<img key={work.id} src={workAsset(work.poster)} alt={work.title + '：' + work.caption} decoding="async" onError={()=>setFailed(true)}/>}
            </ElasticFrame>
            {!failed&&<div className="work-media-controls"><button onClick={()=>setZoom(value=>!value)} aria-pressed={zoom}><Icon name="magnifier-linear" size={17}/>{zoom?'收起':'看近一点'}</button></div>}
          </>}
        </div>
        <div className="work-stage-caption"><div><h3>{work.title}</h3><p>{work.caption}</p></div><div className="work-next"><button className="previous-work" aria-label="上一件作品" onClick={()=>onWork(works[(index-1+works.length)%works.length].id)}><Icon name="arrow-right-linear" size={20}/></button><span aria-label={`第 ${index+1} 件，共 ${works.length} 件`}>{String(index+1).padStart(2,'0')} <i>/ {String(works.length).padStart(2,'0')}</i></span><button aria-label="下一件作品" onClick={()=>onWork(works[(index+1)%works.length].id)}><Icon name="arrow-right-linear" size={20}/></button></div></div>
      </>}
    </div>
    {!reading&&<nav className="work-switcher" aria-label="选择作品">{works.map(item=><button key={item.id} className={work?.id===item.id?'active':''} aria-pressed={work?.id===item.id} onClick={()=>onWork(item.id)} style={{'--swatch':item.color} as CSSProperties}><span aria-hidden="true"/><span>{item.keyLabel}</span></button>)}</nav>}
  </div>;
}

export function PortfolioGallery({onOpen,reduced=false}:{onOpen:(id:WorkId)=>void;reduced?:boolean}){
  return <div className="portfolio-gallery">{works.map((work,index)=><article className={'portfolio-piece piece-' + work.id + (work.video?' has-film':'')} key={work.id} style={{'--piece-color':work.color} as CSSProperties}>
    <div className="portfolio-image">
      {work.video?<WorkFilm key={work.id + ':' + work.video} src={workAsset(work.video)} poster={workAsset(work.poster)} title={work.title} reduced={reduced} frameVariant={index} preview onOpen={()=>onOpen(work.id)}/>:<button type="button" className="portfolio-art-open" onClick={()=>onOpen(work.id)} aria-label={'打开' + work.title}><ElasticFrame variant={index} disabled={reduced}><ColorStudy src={workAsset(work.poster)} alt={work.caption} reduced={reduced}/></ElasticFrame><span className="portfolio-view"><Icon name="arrow-right-up-linear"/></span></button>}
      <span className="portfolio-specimen" aria-hidden="true"><i>{work.word}</i></span>
    </div>
    <div className="portfolio-description"><h3><button type="button" onClick={()=>onOpen(work.id)}>{work.title}</button></h3><span>{work.caption}</span></div>
  </article>)}</div>;
}
