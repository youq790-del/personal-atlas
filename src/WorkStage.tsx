import { useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Icon } from './Icon';
import { WeChatShelf } from './WeChatShelf';
import { ElasticFrame } from './ElasticFrame';
import type { WeChatCollection } from './wechat';
import { works, workAsset, type PortfolioWork, type WorkId } from './portfolio';

type Props = {work?:PortfolioWork;reading:boolean;collection?:WeChatCollection;reduced:boolean;onClose:()=>void;onWork:(id:WorkId)=>void};
export function WorkStage({work,reading,collection,reduced,onClose,onWork}:Props) {
  const stage=useRef<HTMLDivElement>(null),closeButton=useRef<HTMLButtonElement>(null),media=useRef<HTMLDivElement>(null);
  const [zoom,setZoom]=useState(false),[failed,setFailed]=useState(false),[playing,setPlaying]=useState(false);
  const video=useRef<HTMLVideoElement>(null);
  const active=work?.id||(reading?'writing':'');
  const previousFocus=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    previousFocus.current=document.activeElement as HTMLElement|null;
    closeButton.current?.focus({preventScroll:true});
    const frame=requestAnimationFrame(()=>{
      if(stage.current?.closest('.fallback-skills'))window.scrollTo({top:window.scrollY+stage.current.getBoundingClientRect().top-100,behavior:'instant'});
    });
    return()=>{cancelAnimationFrame(frame);const target=previousFocus.current;if(target?.isConnected)target.focus({preventScroll:true});};
  },[]);
  useEffect(()=>{setZoom(false);setFailed(false);setPlaying(false);},[active]);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){e.preventDefault();if(zoom)setZoom(false);else onClose();}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[onClose,zoom]);
  useEffect(()=>{
    const pause=()=>{if(document.hidden){video.current?.pause();setPlaying(false);}};
    document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);
  },[]);
  useGSAP(()=>{
    if(reduced)return;
    gsap.fromTo('.work-stage-content',{opacity:.4,clipPath:'inset(14% 16% 12% 16%)',y:26},{opacity:1,clipPath:'inset(0% 0% 0% 0%)',y:0,duration:.72,ease:'expo.out',clearProps:'all'});
    gsap.fromTo('.work-stage-caption > *',{y:18,opacity:0},{y:0,opacity:1,duration:.5,stagger:.045,delay:.16,ease:'expo.out',clearProps:'all'});
  },{scope:stage,dependencies:[active,reduced],revertOnUpdate:true});
  const move=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(reduced||e.pointerType!=='mouse'||!media.current)return;
    const bounds=e.currentTarget.getBoundingClientRect();
    const x=(e.clientX-bounds.left)/bounds.width,y=(e.clientY-bounds.top)/bounds.height;
    media.current.style.setProperty('--look-x',`${x*100}%`);media.current.style.setProperty('--look-y',`${y*100}%`);
    media.current.style.setProperty('--tilt-x',`${(y-.5)*-3}deg`);media.current.style.setProperty('--tilt-y',`${(x-.5)*4}deg`);
  };
  const reset=()=>{media.current?.style.setProperty('--tilt-x','0deg');media.current?.style.setProperty('--tilt-y','0deg');};
  const togglePlayback=async()=>{
    if(!video.current)return;
    if(playing){video.current.pause();setPlaying(false);}
    else{try{await video.current.play();setPlaying(true);}catch{setPlaying(false);}}
  };
  const index=works.findIndex(item=>item.id===work?.id);
  return <div ref={stage} className={`work-stage ${reading?'work-stage-reading':''} ${zoom?'work-stage-zoom':''}`} style={{'--work-color':work?.color||'#8ba885'} as CSSProperties} role="region" aria-label={reading?'公众号作品':`${work?.title}作品展厅`}>
    <div className="work-stage-content">
      <div className="work-stage-toolbar"><button ref={closeButton} className="work-back" onClick={()=>{if(zoom)setZoom(false);else onClose();}}><Icon name="arrow-up-linear" size={18}/><span>{zoom?'返回作品':'返回键盘'}</span><kbd>Esc</kbd></button>{work&&<span className="work-medium">Blender study</span>}</div>
      {reading?<div className="work-reading-scroll" data-lenis-prevent><WeChatShelf collection={collection} reduced={reduced}/></div>:work&&<>
        <div ref={media} className={`work-media ${zoom?'is-magnified':''} ${failed?'media-failed':''}`} onPointerMove={move} onPointerLeave={reset}>
          <ElasticFrame variant={index} disabled={reduced||zoom} className="work-art-frame" preserveContent>
          {failed?<div className="work-media-error"><Icon name="document-text-linear" size={36}/><p>这幅作品暂时没有加载出来。</p><button className="text-link" onClick={()=>setFailed(false)}>重新加载</button></div>:work.video?<video key={work.id} ref={video} src={workAsset(work.video)} poster={workAsset(work.poster)} muted loop playsInline preload="none" onError={()=>setFailed(true)} aria-label={work.title}/>:<img key={work.id} src={workAsset(work.poster)} alt={`${work.title}：${work.caption}`} decoding="async" onError={()=>setFailed(true)}/>}
          </ElasticFrame>
          {!failed&&<div className="work-media-controls">{work.video&&<button onClick={togglePlayback} aria-pressed={playing}>{playing?<span className="pause-mark" aria-hidden="true"><i/><i/></span>:<Icon name="arrow-right-linear" size={17}/>} {playing?'暂停':'播放作品'}</button>}<button onClick={()=>setZoom(v=>!v)} aria-pressed={zoom}><Icon name="magnifier-linear" size={17}/>{zoom?'收起':'看近一点'}</button></div>}
        </div>
        <div className="work-stage-caption"><div><h3>{work.title}</h3><p>{work.caption}</p></div><div className="work-next"><button className="previous-work" aria-label="上一件作品" onClick={()=>onWork(works[(index-1+works.length)%works.length].id)}><Icon name="arrow-right-linear" size={20}/></button><span aria-label={`第 ${index+1} 件，共 ${works.length} 件`}>{String(index+1).padStart(2,'0')} <i>/ {String(works.length).padStart(2,'0')}</i></span><button aria-label="下一件作品" onClick={()=>onWork(works[(index+1)%works.length].id)}><Icon name="arrow-right-linear" size={20}/></button></div></div>
      </>}
    </div>
    {!reading&&<nav className="work-switcher" aria-label="选择作品">{works.map(item=><button key={item.id} className={work?.id===item.id?'active':''} aria-pressed={work?.id===item.id} onClick={()=>onWork(item.id)} style={{'--swatch':item.color} as CSSProperties}><span aria-hidden="true"/><span>{item.keyLabel}</span></button>)}</nav>}
  </div>;
}

export function PortfolioGallery({onOpen,reduced=false}:{onOpen:(id:WorkId)=>void;reduced?:boolean}){
  return <div className="portfolio-gallery">{works.map((work,index)=><button className={`portfolio-piece piece-${work.id}`} key={work.id} onClick={()=>onOpen(work.id)} style={{'--piece-color':work.color} as CSSProperties}><div className="portfolio-image"><ElasticFrame variant={index} disabled={reduced}><img src={workAsset(work.poster)} alt={work.caption} loading="lazy" decoding="async"/></ElasticFrame><span className="portfolio-specimen" aria-hidden="true"><i>{work.word}</i></span><span className="portfolio-view"><Icon name="arrow-right-up-linear"/></span></div><div className="portfolio-description"><h3>{work.title}</h3><span>{work.caption}</span></div></button>)}</div>;
}
