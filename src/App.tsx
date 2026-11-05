import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { Icon } from './Icon';
import { BrandMark } from './Brand';
import { SurfaceHero } from './SurfaceHero';
import { DiscoveryBridge } from './DiscoveryBridge';
import { AuthorNote } from './AuthorNote';
import './art-site.css';
import { KineticArtwork } from './KineticSurface';
import { resolveShortcuts } from './scene/input';
import { Modal } from './Modal';
import { Editor } from './Editor';
import { loadProfile, skillsFor, isTemplateEntry, profileIdentity, PROFILE_KEY, categories, safeUrl, asset, type Profile, type Entry, type Skill } from './data';
import { useRoom } from './realtime';
import type { KeyboardSection } from './scene/motion';
import { resolveKeyboardSection } from './scene/sections';
import { PortfolioGallery, WorkStage } from './WorkStage';
import { WeChatShelf } from './WeChatShelf';
import { ElasticFrame } from './ElasticFrame';
import { ContactFinale } from './ContactFinale';
import { usePublishedWriting } from './usePublishedWriting';
import { workById, works, type WorkId } from './portfolio';
gsap.registerPlugin(ScrollTrigger,useGSAP);
const KeyboardScene=lazy(()=>import('./scene/KeyboardScene'));
const sections=[['hero','曲面','Begin'],['skills','键盘','Explore'],['projects','Blender','Made'],['writing','笔记','Read'],['experience','关于我','yo7']];

type Overlay='menu'|'about'|'editor'|'chat'|'directory'|null;
class SceneBoundary extends React.Component<{children:React.ReactNode;onFail:()=>void},{failed:boolean}> {
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFail();}render(){return this.state.failed?null:this.props.children;}
}
export default function App(){
  const [profile,setProfile]=useState(loadProfile);
  const identity=useMemo(()=>profileIdentity(profile),[profile]);
  const publicEntries=useMemo(()=>profile.entries.filter(entry=>!isTemplateEntry(entry)),[profile.entries]);
  const writing=usePublishedWriting(profile.wechat,profile.wechatAutoUpdate);
  const paperArticle=writing?.articles.find(article=>article.title.toLowerCase()==='breaking bad');
  const [articleRequest,setArticleRequest]=useState<{id:string;token:number}>();
  const skills=useMemo(()=>skillsFor(profile),[profile]);
  const writingKey=useMemo<Skill>(()=>skills.find(skill=>skill.name==='action-writing')||{name:'action-writing',label:'文章',shortDescription:'公众号文章归档',detail:'',color:'#93b5a5',icon:'',demo:false},[skills]);
  const shortcuts=useMemo(()=>resolveShortcuts(skills,Math.min(6,skills.length)),[skills]);
  const [overlay,setOverlay]=useState<Overlay>(null),[detail,setDetail]=useState<Entry|Skill|null>(null);
  const [selected,setSelected]=useState<Skill|null>(null),[section,setSection]=useState<KeyboardSection>('hero');
  const [focusKey,setFocusKey]=useState<string|null>(null),[activeWork,setActiveWork]=useState<WorkId|null>(null),[reading,setReading]=useState(false);
  const [sceneStatus,setSceneStatus]=useState<'loading'|'ready'|'failed'>('loading');
  const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('space-theme')||'dark';}catch{return 'dark';}});
  const [sound,setSound]=useState(false),[quiet,setQuiet]=useState(false);
  const reduced=!!useReducedMotion()||quiet;
  const [filter,setFilter]=useState('all'),[query,setQuery]=useState('');
  const [showAllWorks,setShowAllWorks]=useState(false);
  const [keyboardLoaded,setKeyboardLoaded]=useState(false);
  const [playful,setPlayful]=useState(false);
  const [petSignal,setPetSignal]=useState(0),[rotationSignal,setRotationSignal]=useState(0);
  const [paperHeader,setPaperHeader]=useState(false),[finaleHeader,setFinaleHeader]=useState(false),[heroHeader,setHeroHeader]=useState(true);
  const [toast,setToast]=useState(''),[chatText,setChatText]=useState('');
  const room=useRoom(),root=useRef<HTMLDivElement>(null),lenis=useRef<Lenis|null>(null);
  const currentSection=useRef<KeyboardSection>('hero');
  const pendingFocus=useRef<string|null>(null),focusNavigationFrame=useRef<number|null>(null),focusClearFrame=useRef<number|null>(null);
  const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null),chatEnd=useRef<HTMLDivElement>(null);
  const notify=useCallback((text:string)=>{setToast(text);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4200);},[]);
  const onReady=useCallback((ready:boolean)=>setSceneStatus(ready?'ready':'failed'),[]);
  const fail=useCallback(()=>onReady(false),[onReady]);
  const onSelect=useCallback((skill:Skill|null)=>setSelected(skill),[]);
  const onSection=useCallback((value:KeyboardSection)=>{
    const previous=currentSection.current;currentSection.current=value;setSection(value);
    if(value==='skills'){
      pendingFocus.current=null;
      if(focusClearFrame.current!==null)cancelAnimationFrame(focusClearFrame.current);
      focusClearFrame.current=null;
    }else if(previous==='skills'&&!pendingFocus.current&&focusClearFrame.current===null){
      // ScrollTrigger temporarily scrolls to zero while measuring. Only a section
      // that is still outside the stage after that refresh may dismiss its content.
      focusClearFrame.current=requestAnimationFrame(()=>{
        focusClearFrame.current=null;
        if(currentSection.current!=='skills'&&!pendingFocus.current){setFocusKey(null);setActiveWork(null);setReading(false);}
      });
    }
  },[]);
  const openKeyboardContent=useCallback((id:WorkId|null)=>{
    const region=document.getElementById('skills'),rect=region?.getBoundingClientRect();
    const visible=Boolean(rect&&rect.top<=0&&rect.bottom>=innerHeight);
    const navigate=Boolean(region&&(currentSection.current!=='skills'||!visible));
    const key=id?'work-'+id:'action-writing';
    if(focusNavigationFrame.current!==null)cancelAnimationFrame(focusNavigationFrame.current);
    focusNavigationFrame.current=null;pendingFocus.current=navigate?key:null;
    setOverlay(null);setDetail(null);setPlayful(false);setReading(id===null);setActiveWork(id);setFocusKey(key);
    if(navigate)focusNavigationFrame.current=requestAnimationFrame(()=>{
      focusNavigationFrame.current=null;
      // Wait for the directory to release its scroll lock before moving the stage.
      const target=document.getElementById('skills');
      if(!target){pendingFocus.current=null;return;}
      if(lenis.current)lenis.current.scrollTo(target,{offset:0,duration:1.15,force:true});
      else{target.scrollIntoView({behavior:'instant'});pendingFocus.current=null;}
    });
  },[]);
  const onOpen=useCallback((skill:Skill)=>{
    setSelected(skill);
    if(skill.name.startsWith('work-')){
      const id=skill.name.slice(5) as WorkId;
      openKeyboardContent(id);
    } else if(skill.name==='action-writing'){
      openKeyboardContent(null);
    } else if(skill.name==='action-cat'){setPlayful(true);setActiveWork(null);setReading(false);setFocusKey(null);setPetSignal(v=>v+1);}
    else if(skill.name==='action-theme')setTheme(v=>v==='light'?'dark':'light');
    else if(skill.name==='action-sound')setSound(v=>!v);
    else if(skill.name==='action-rotate')setRotationSignal(v=>v+1);
    else if(skill.name==='action-home'){setFocusKey(null);setActiveWork(null);setReading(false);go('hero');}
    else if(skill.name==='action-experience'){setFocusKey(null);setActiveWork(null);setReading(false);go('experience');}
    else if(skill.name==='action-achievements'){setFocusKey(null);setActiveWork(null);setReading(false);go('writing');}
    else if(skill.name==='action-projects'){setFocusKey(null);setActiveWork(null);setReading(false);go('projects');}
    else if(skill.name==='action-contact'){setFocusKey(null);setActiveWork(null);setReading(false);go('contact');}
    else if(skill.name==='action-about')setOverlay('about');
    else if(skill.name==='action-skills')setOverlay('about');
    else setDetail(skill);
  },[openKeyboardContent]);
  const closeFocus=useCallback(()=>{
    if(focusNavigationFrame.current!==null)cancelAnimationFrame(focusNavigationFrame.current);
    if(focusClearFrame.current!==null)cancelAnimationFrame(focusClearFrame.current);
    focusClearFrame.current=null;
    focusNavigationFrame.current=null;pendingFocus.current=null;
    setFocusKey(null);setActiveWork(null);setReading(false);
  },[]);
  useEffect(()=>{
    let frame:number|null=null,refreshing=false;
    const sync=()=>{
      frame=null;
      if(refreshing)return;
      const anchors=Array.from(document.querySelectorAll<HTMLElement>('#hero,#discovery,#skills,#projects,#writing,#experience,#contact')).map(element=>({id:element.id as KeyboardSection,top:element.getBoundingClientRect().top}));
      const bounds=document.getElementById('skills')?.getBoundingClientRect();
      onSection(resolveKeyboardSection(anchors,innerHeight,bounds?{top:bounds.top,bottom:bounds.bottom}:undefined));
    };
    const schedule=()=>{if(frame===null)frame=requestAnimationFrame(sync);};
    const beginRefresh=()=>{refreshing=true;};
    const endRefresh=()=>{refreshing=false;schedule();};
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    ScrollTrigger.addEventListener('refreshInit',beginRefresh);
    ScrollTrigger.addEventListener('refresh',endRefresh);
    schedule();
    return()=>{if(frame!==null)cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);ScrollTrigger.removeEventListener('refreshInit',beginRefresh);ScrollTrigger.removeEventListener('refresh',endRefresh);};
  },[onSection]);
  const selectWork=useCallback((id:WorkId)=>openKeyboardContent(id),[openKeyboardContent]);
  const openWorkFromGallery=selectWork;
  useEffect(()=>()=>{
    if(focusNavigationFrame.current!==null)cancelAnimationFrame(focusNavigationFrame.current);
    if(focusClearFrame.current!==null)cancelAnimationFrame(focusClearFrame.current);
  },[]);
  const close=useCallback(()=>setOverlay(null),[]);
  const readArticle=useCallback((id:string)=>{
    setOverlay(null);
    if(!writing?.articles.some(article=>article.id===id)){
      requestAnimationFrame(()=>{
        const target=document.getElementById('writing');
        if(target){if(lenis.current)lenis.current.scrollTo(target,{offset:-100});else target.scrollIntoView({behavior:'instant'});}
      });
      return;
    }
    lenis.current?.scrollTo(window.scrollY,{immediate:true});
    setArticleRequest(previous=>({id,token:(previous?.token||0)+1}));
  },[writing]);
  const go=(id:string)=>{if(focusNavigationFrame.current!==null)cancelAnimationFrame(focusNavigationFrame.current);focusNavigationFrame.current=null;pendingFocus.current=null;setOverlay(null);requestAnimationFrame(()=>{const target=document.getElementById(id);if(target){if(lenis.current)lenis.current.scrollTo(target,{offset:id==='skills'||id==='hero'?0:-70,duration:1.25});else target.scrollIntoView({behavior:'instant'});}});};
  useEffect(()=>{
    const media=matchMedia('(prefers-color-scheme: dark)');
    const apply=()=>{document.documentElement.dataset.theme=theme==='system'?(media.matches?'dark':'light'):theme;};apply();media.addEventListener('change',apply);
    try{localStorage.setItem('space-theme',theme);}catch{}
    return()=>media.removeEventListener('change',apply);
  },[theme]);
  useEffect(()=>{
    if(reduced)return;
    const scroll=new Lenis({duration:1.15,smoothWheel:true,anchors:true});lenis.current=scroll;
    scroll.on('scroll',ScrollTrigger.update);
    const tick=(time:number)=>{if(!document.hidden)scroll.raf(time*1000);};gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);
    const refresh=()=>ScrollTrigger.refresh();document.fonts.ready.then(refresh);window.addEventListener('load',refresh);
    return()=>{gsap.ticker.remove(tick);scroll.off('scroll',ScrollTrigger.update);scroll.destroy();lenis.current=null;window.removeEventListener('load',refresh);};
  },[reduced]);
  useEffect(()=>{if(overlay||detail)lenis.current?.stop();else lenis.current?.start();},[overlay,detail]);
  useGSAP(()=>{
    if(reduced)return;
    gsap.from('.site-header',{y:-12,opacity:0,duration:.6,ease:'power2.out',clearProps:'all'});
    gsap.to('.surface-art',{yPercent:9,rotation:3,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:.5}});
    gsap.to('.skills-stage-inner',{autoAlpha:0,y:-24,ease:'none',scrollTrigger:{trigger:'#skills',start:'bottom 92%',end:'bottom 48%',scrub:true}});
    const progress=root.current?.querySelector('.reading-progress');
    if(progress)ScrollTrigger.create({start:0,end:'max',onUpdate:self=>gsap.set(progress,{scaleX:self.progress})});
  },{scope:root,dependencies:[reduced],revertOnUpdate:true});
  useEffect(()=>{
    const target=document.getElementById('skills');
    if(!target)return;
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){setKeyboardLoaded(true);observer.disconnect();}
    },{rootMargin:'600px 0px'});
    observer.observe(target);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>()=>{if(toastTimer.current)clearTimeout(toastTimer.current);},[]);
  useEffect(()=>{if(overlay==='chat')chatEnd.current?.scrollIntoView({block:'nearest'});},[room.messages,overlay]);
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>ScrollTrigger.refresh());
    const observer=new ResizeObserver(()=>ScrollTrigger.refresh());
    document.querySelectorAll('#discovery,#experience,#projects,#writing').forEach(el=>observer.observe(el));
    return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[profile,filter,query,reduced,sceneStatus,showAllWorks]);
  useEffect(()=>{
    const updateSurface=()=>{const light=['discovery','projects','writing','experience'].some(id=>{const b=document.getElementById(id)?.getBoundingClientRect();return b&&b.top<=70&&b.bottom>70;});setPaperHeader(light);setHeroHeader((document.getElementById('hero')?.getBoundingClientRect().bottom??0)>70);};
    const surface=ScrollTrigger.create({start:0,end:'max',onUpdate:updateSurface,onRefresh:updateSurface});
    const finale=ScrollTrigger.create({trigger:'#contact',start:'top 100px',end:'max',onToggle:self=>setFinaleHeader(self.isActive),onRefresh:self=>setFinaleHeader(self.isActive)});
    return()=>{surface.kill();finale.kill();};
  },[]);
  const saveProfile=(next:Profile)=>{try{localStorage.setItem(PROFILE_KEY,JSON.stringify(next));}catch{throw new Error('本机存储已满，请先导出资料备份。');}setSceneStatus('loading');setProfile(next);notify('资料已保存在当前浏览器。');};
  const sendChat=(event:FormEvent)=>{event.preventDefault();if(!chatText.trim())return;room.send(chatText);setChatText('');};
  const entries=publicEntries.filter(e=>(filter==='all'||e.category===filter)&&`${e.title} ${e.description} ${e.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const displayName=identity.name;
  const showFallback=reduced||sceneStatus==='failed';
  const directorySkills=skills.map((skill,index)=>({skill,index})).filter(({skill})=>!showFallback||!['action-cat','action-rotate'].includes(skill.name));
  return <div ref={root} className={`space-app kinetic-app art-site ${showFallback?'static-scene':''}`}>
    <a href="#main" className="skip-link">跳到主要内容</a><div className="reading-progress" aria-hidden="true"/>
    {keyboardLoaded&&!reduced&&skills.length>0&&<div className="scene-layer" data-section={section}><SceneBoundary onFail={fail}><Suspense fallback={null}><KeyboardScene key={JSON.stringify(skills)} skills={skills} sound={sound} playful={playful} petSignal={petSignal} rotationSignal={rotationSignal} focusKey={focusKey} onReady={onReady} onSelect={onSelect} onSection={onSection} onOpen={onOpen}/></Suspense></SceneBoundary></div>}
    <header className={`site-header ${finaleHeader?'on-finale':paperHeader?'on-paper':heroHeader?'on-hero':''}`}>
      <a href="#hero" className="wordmark" onClick={e=>{e.preventDefault();go('hero');}} aria-label={`${displayName}，回到曲面`}><BrandMark/><span className="wordmark-type">{displayName}</span></a>
      <nav className="header-paths" aria-label="主要导航"><button onClick={()=>go('skills')}>探索</button><button onClick={()=>go('writing')}>笔记</button><button onClick={()=>go('experience')}>关于我</button></nav>
      <button className="menu-button" onClick={()=>setOverlay('menu')} aria-label="打开导航与设置"><span>菜单</span><i aria-hidden="true"/></button>
    </header>
    <main id="main">
      <SurfaceHero reduced={reduced} onDiscover={()=>go('discovery')} onRead={()=>paperArticle?readArticle(paperArticle.id):go('writing')}/>
      <DiscoveryBridge reduced={reduced} onRead={()=>paperArticle?readArticle(paperArticle.id):go('writing')} onExplore={()=>go('skills')}/>
      <section id="skills" className={`skills-section ${showFallback?'fallback-skills':''} ${activeWork||reading||(!showFallback&&focusKey)?'is-exploring':''}`} aria-label="通过键盘探索作品">
        <div className="skills-stage"><div className="skills-stage-inner">
          <div className="section-title skills-heading"><h2>{activeWork?workById(activeWork)?.title:reading?'笔记':playful?'摸摸它。':'按一颗。'}</h2><p>{focusKey?'':'我的练习，放在这些键里。'}</p></div>
          {showFallback&&<img className="stage-keyboard-poster" src={asset('assets/keyboard/keyboard-comic-poster.webp')} alt="彩色机械键盘；使用下方键位目录探索作品"/>}
          <div className="skill-readout"><div aria-live="polite"><strong>{selected?.label||'选一颗键，打开一件作品。'}</strong><p>{showFallback?'点击 / Tab + Enter':playful?'轻触小猫':'拖拽旋转 · 点按键帽'}</p></div><div className="skill-controls">
            {!showFallback&&<><button className="text-link" aria-pressed={playful} onClick={()=>setPlayful(!playful)}>{playful?'回到键盘':'小猫'}</button>{playful?<button className="text-link" onClick={()=>setPetSignal(v=>v+1)}>摸摸它</button>:<button className="text-link" onClick={()=>setRotationSignal(v=>v+1)}>旋转</button>}</>}
            <button className="editorial-link" onClick={()=>setOverlay('directory')}>键位目录<Icon name="arrow-right-up-linear" size={18}/></button>
          </div></div>
        </div>{(activeWork||reading)&&<WorkStage key={activeWork||'writing'} work={workById(activeWork)} reading={reading} collection={writing} reduced={reduced} onClose={closeFocus} onWork={selectWork}/>}</div>
        {showFallback&&<div className="skill-static-grid">{directorySkills.map(({skill,index:i})=><button key={skill.name} onClick={()=>onOpen(skill)} style={{'--key-color':skill.color} as React.CSSProperties}><span>{skill.label}</span><kbd>{shortcuts[i]?.replace(/^(Key|Digit)/,'')||'点击'}</kbd></button>)}</div>}
      </section>
      <div className="editorial-world">
        <section id="projects" className="projects-section" aria-labelledby="made-title">
          <div className="section-title art-section-title"><h2 id="made-title">做着玩。</h2><p>Blender 里的几次尝试。</p></div>
          <PortfolioGallery onOpen={openWorkFromGallery} reduced={reduced} featured={!showAllWorks}/>
          <button className="all-works-button" aria-expanded={showAllWorks} onClick={()=>setShowAllWorks(v=>!v)}>{showAllWorks?'收起其他练习':`还有 ${Math.max(0,works.length-2)} 件练习`}<Icon name={showAllWorks?'arrow-up-linear':'arrow-down-linear'} size={18}/></button>
          {publicEntries.length>0&&<div className="additional-records"><div className="project-tools"><div className="filters" role="group" aria-label="筛选档案">{[['all','全部'],...Object.entries(categories)].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div><label className="search-box"><Icon name="magnifier-linear"/><input aria-label="搜索档案" placeholder="搜索档案" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><div className="projects-grid">{entries.map((entry,i)=><button key={entry.id} className={`project-card project-${entry.category}`} onClick={()=>setDetail(entry)}><div className="project-preview"><ElasticFrame variant={i+2} disabled={reduced}>{entry.image&&safeUrl(entry.image,true)?<img src={safeUrl(entry.image,true)} alt={entry.title}/>:<div className="project-art"><KineticArtwork variant={i}/></div>}</ElasticFrame></div><div className="project-caption"><h3>{entry.title}</h3><span>{categories[entry.category]}</span></div></button>)}</div></div>}
        </section>
        <section id="writing" className="art-writing" aria-label="学习笔记与观察"><WeChatShelf collection={writing} compact reduced={reduced} openArticle={articleRequest}/></section>
        <AuthorNote name={displayName} bio={identity.bio} onContact={()=>go('contact')}/>
      </div>
      <ContactFinale name={displayName} collection={writing} email={profile.email} reduced={reduced} onRead={()=>go('writing')}/>
    </main>
    <footer className="site-colophon"><span>© {new Date().getFullYear()} {displayName}</span><button className="text-link" onClick={()=>setOverlay('editor')}>编辑资料</button><a href="https://github.com/Naresh-Khatri/3d-portfolio" target="_blank" rel="noreferrer">Based on Naresh Khatri · MIT</a><button className="icon-button bare" aria-label="回到顶部" onClick={()=>go('hero')}><Icon name="arrow-up-linear"/></button></footer>
    {sceneStatus==='loading'&&section==='skills'&&!reduced&&<div className="scene-loading" role="status"><span/>正在组装键盘</div>}
    {room.peers.filter(p=>p.x!==undefined).map(peer=><div className="remote-cursor" key={peer.id} style={{left:`${(peer.x||0)*100}%`,top:`${(peer.y||0)*100}%`,color:peer.color}}><Icon name="cursor-bold"/><span style={{background:peer.color}}>{peer.name}</span></div>)}
    <AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:10,opacity:0}}>{toast}<button aria-label="关闭提示" onClick={()=>setToast('')}><Icon name="close-circle-linear" size={16}/></button></motion.div>}</AnimatePresence>
    {overlay==='menu'&&<Modal title="去哪里？" onClose={close} wide className="nav-modal"><nav className="expanded-nav" aria-label="章节">{sections.map(([id,label,en])=><button key={id} onClick={()=>go(id)}><span>{label}</span><small>{en}</small></button>)}</nav><div className="art-menu-settings"><div role="group" aria-label="主题">{[['dark','夜间'],['light','日间'],['system','跟随系统']].map(([value,label])=><button key={value} className="text-link" aria-pressed={theme===value} onClick={()=>setTheme(value)}>{label}</button>)}</div><button className="text-link" aria-pressed={quiet} onClick={()=>setQuiet(!quiet)}>{quiet?'恢复动态':'减少动态'}</button><button className="text-link" aria-pressed={sound} onClick={()=>setSound(!sound)}>{sound?'关闭键盘声音':'开启键盘声音'}</button><button className="text-link" onClick={()=>setOverlay('chat')}>访客房间</button><button className="text-link" onClick={()=>setOverlay('editor')}>编辑资料</button><a href="https://github.com/youq790-del/personal-atlas" target="_blank" rel="noreferrer">源码</a></div></Modal>}
    {overlay==='directory'&&<Modal title="键位" onClose={close} wide className="directory-modal"><p className="muted">点击，或用 Tab + Enter 打开内容。{!showFallback&&'关闭目录后，可使用键位旁标注的实体按键。'}</p><div className="skill-static-grid">{directorySkills.map(({skill,index:i})=><button key={skill.name} onClick={()=>{close();onOpen(skill);}} style={{'--key-color':skill.color} as React.CSSProperties}>{skill.icon?<img src={skill.icon} alt=""/>:<Icon name="widget-2-linear"/>}<span>{skill.label}</span><kbd>{shortcuts[i]?.replace(/^(Key|Digit)/,'')||'点击'}</kbd></button>)}</div></Modal>}
    {overlay==='editor'&&<Editor profile={{...profile,wechat:writing}} onSave={saveProfile} onClose={close}/>}
    {overlay==='about'&&<Modal title={displayName} onClose={close} wide><p className="about-role">{identity.role}</p><p className="about-bio">{identity.bio}</p><div className="about-facets">{['skills','interests','traits'].map(key=><div key={key}><h3>{identity.facets[key].caption}</h3><p className="muted">{identity.facets[key].description}</p><div className="tags">{identity.facets[key].tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>)}</div><div className="about-leads"><button className="editorial-link" onClick={()=>go('experience')}><span>最近在做</span><Icon name="arrow-right-up-linear"/></button><button className="editorial-link" onClick={()=>go('writing')}><span>读笔记</span><Icon name="arrow-right-up-linear"/></button></div></Modal>}

    {overlay==='chat'&&<Modal title="访客聊天室" onClose={close}><div className="room-status"><span className={`status-light ${room.mode==='online'?'online':''}`}/><span>{room.mode==='online'?'实时连接':room.mode==='connecting'?'正在连接 · 本地可用':'本地房间'} · {room.peers.length+1} 人</span></div><p className="muted small">{room.mode==='online'?'当前房间的访客可以实时聊天。消息仅在本次会话中保留。':'当前仅同一浏览器的标签页互通；公网聊天室尚未连接。消息不会发送给站点主人。'}</p><div className="chat-log" role="log" aria-live="polite">{!room.messages.length&&<div className="chat-empty"><Icon name="chat-round-dots-linear" size={40}/><p>还没有对话。</p><span>从一句“你好”开始吧。</span></div>}{room.messages.map(m=><div className={`chat-message ${m.id===room.me.id?'mine':''}`} key={m.messageId}><small style={{color:m.color}}>{m.id===room.me.id?'你':m.name}</small><p>{m.text}</p></div>)}<div ref={chatEnd}/></div><form className="chat-form" onSubmit={sendChat}><input aria-label="聊天消息" placeholder="说点什么…" maxLength={500} value={chatText} onChange={e=>setChatText(e.target.value)}/><button className="icon-button" type="submit" aria-label="发送消息" disabled={!chatText.trim()}><Icon name="plain-linear"/></button></form></Modal>}
    {detail&&<Modal title={'label'in detail&&'name'in detail?detail.label:('title'in detail?detail.title:'键位介绍')} onClose={()=>setDetail(null)} wide>{'color'in detail&&<div className="detail-key" style={{background:detail.color}}>{detail.icon?<img src={detail.icon} alt=""/>:<Icon name="keyboard-linear" size={42}/>}</div>}<p className="detail-copy">{detail.detail}</p>{'tags'in detail&&<div className="tags">{detail.tags.map(t=><span key={t}>{t}</span>)}</div>}{'url'in detail&&detail.url&&safeUrl(detail.url)&&<a className="button primary" href={safeUrl(detail.url)} target="_blank" rel="noreferrer">查看作品<Icon name="arrow-right-up-linear"/></a>}{(('demo'in detail&&detail.demo)||profile.isDemo)&&<p className="muted small">内容示意 · 真实个人资料待补充</p>}</Modal>}
  </div>;
}



