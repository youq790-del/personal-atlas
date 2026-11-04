import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { Icon } from './Icon';
import { BrandMark } from './Brand';
import { OpeningSequence } from './OpeningSequence';
import { SeamTransition } from './SeamTransition';
import { ElasticText, ElasticLine, KineticArtwork, ParticleField, useKineticSurface } from './KineticSurface';
import { resolveShortcuts } from './scene/input';
import { Modal } from './Modal';
import { Editor } from './Editor';
import { loadProfile, skillsFor, PROFILE_KEY, categories, safeUrl, asset, type Profile, type Entry, type Skill } from './data';
import { useRoom } from './realtime';
import type { KeyboardSection } from './scene/motion';
import { PortfolioGallery, WorkStage } from './WorkStage';
import { WeChatShelf } from './WeChatShelf';
import { ElasticFrame } from './ElasticFrame';
import { FieldBackdrop } from './FieldBackdrop';
import { workById, works, type WorkId } from './portfolio';
gsap.registerPlugin(ScrollTrigger,useGSAP);
const KeyboardScene=lazy(()=>import('./scene/KeyboardScene'));
const sections=[['hero','首页','Home'],['skills','技能','Skills'],['experience','经历','Experience'],['projects','作品','Projects'],['contact','联系','Contact']];
const stars=Array.from({length:88},(_,i)=>({left:`${(i*37.17+7)%100}%`,top:`${(i*19.67+11)%100}%`,opacity:0.16+(i%5)*0.1,width:i%4?1.5:2.5,height:i%4?1.5:2.5}));
type Overlay='menu'|'about'|'editor'|'chat'|'game'|'directory'|null;
class SceneBoundary extends React.Component<{children:React.ReactNode;onFail:()=>void},{failed:boolean}> {
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFail();}render(){return this.state.failed?null:this.props.children;}
}
function MiniGame(){
  const [playing,setPlaying]=useState(false),[target,setTarget]=useState(0),[score,setScore]=useState(0),[time,setTime]=useState(20);
  useEffect(()=>{if(!playing)return;const interval=setInterval(()=>setTime(t=>Math.max(0,t-1)),1000);return()=>clearInterval(interval);},[playing]);
  useEffect(()=>{if(time===0)setPlaying(false);},[time]);
  const hit=(i:number)=>{if(!playing||i!==target)return;setScore(s=>s+1);setTarget(t=>(t+1+Math.floor(Math.random()*8))%9);};
  return <><p className="muted">20 秒内，按下亮起的键。鼠标、触屏，或者 Tab + Enter 都可以。</p><div className="game-score"><span>命中 <strong>{score}</strong></span><span>剩余 <strong>{time}s</strong></span></div><div className="game-board">{Array.from({length:9},(_,i)=><button key={i} className={`game-key ${playing&&target===i?'lit':''}`} onClick={()=>hit(i)} disabled={!playing} aria-label={`键 ${i+1}${playing&&target===i?'，已亮起':''}`}>{i+1}</button>)}</div><p aria-live="polite">{time===0?`完成！你按中了 ${score} 颗键。`:'让眼睛和手指一起热身。'}</p><button className="button primary" onClick={()=>{setTime(20);setScore(0);setTarget(Math.floor(Math.random()*9));setPlaying(true);}}>{playing?'重新开始':'开始挑战'}</button></>;
}
export default function App(){
  const [profile,setProfile]=useState(loadProfile);
  const skills=useMemo(()=>skillsFor(profile),[profile]);
  const writingKey=useMemo<Skill>(()=>skills.find(skill=>skill.name==='action-writing')||{name:'action-writing',label:'文章',shortDescription:'公众号文章归档',detail:'',color:'#93b5a5',icon:'',demo:false},[skills]);
  const shortcuts=useMemo(()=>resolveShortcuts(skills,Math.min(6,skills.length)),[skills]);
  const [overlay,setOverlay]=useState<Overlay>(null),[detail,setDetail]=useState<Entry|Skill|null>(null);
  const [selected,setSelected]=useState<Skill|null>(null),[section,setSection]=useState<KeyboardSection>('hero');
  const [focusKey,setFocusKey]=useState<string|null>(null),[activeWork,setActiveWork]=useState<WorkId|null>(null),[reading,setReading]=useState(false);
  const [sceneStatus,setSceneStatus]=useState<'loading'|'ready'|'failed'>('loading');
  const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('space-theme')||'dark';}catch{return 'dark';}});
  const [themeMenu,setThemeMenu]=useState(false),[sound,setSound]=useState(true),[quiet,setQuiet]=useState(false);
  const reduced=!!useReducedMotion()||quiet;
  const [filter,setFilter]=useState('all'),[query,setQuery]=useState('');
  const [replayKey,setReplayKey]=useState(0);
  const [playful,setPlayful]=useState(false);
  const [petSignal,setPetSignal]=useState(0),[rotationSignal,setRotationSignal]=useState(0);
  const [paperHeader,setPaperHeader]=useState(false);
  const [toast,setToast]=useState(''),[party,setParty]=useState(false),[chatText,setChatText]=useState('');
  const room=useRoom(),root=useRef<HTMLDivElement>(null),lenis=useRef<Lenis|null>(null);
  const pendingWork=useRef<WorkId|null>(null);
  const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null),chatEnd=useRef<HTMLDivElement>(null);
  const notify=useCallback((text:string)=>{setToast(text);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4200);},[]);
  const onReady=useCallback((ready:boolean)=>setSceneStatus(ready?'ready':'failed'),[]);
  const fail=useCallback(()=>onReady(false),[onReady]);
  const onSelect=useCallback((skill:Skill|null)=>setSelected(skill),[]);
  const onSection=useCallback((value:KeyboardSection)=>{setSection(value);if(value==='skills')pendingWork.current=null;else if(!pendingWork.current){setFocusKey(null);setActiveWork(null);setReading(false);}},[]);
  const onOpen=useCallback((skill:Skill)=>{
    setSelected(skill);
    if(skill.name.startsWith('work-')){
      const id=skill.name.slice(5) as WorkId;
      setPlayful(false);setReading(false);setActiveWork(id);setFocusKey(skill.name);setDetail(null);
    } else if(skill.name==='action-writing'){
      setPlayful(false);setActiveWork(null);setReading(true);setFocusKey(skill.name);setDetail(null);
    } else if(skill.name==='action-cat'){setPlayful(true);setActiveWork(null);setReading(false);setFocusKey(skill.name);setPetSignal(v=>v+1);}
    else if(skill.name==='action-theme')setTheme(v=>v==='light'?'dark':'light');
    else if(skill.name==='action-sound')setSound(v=>!v);
    else if(skill.name==='action-rotate')setRotationSignal(v=>v+1);
    else if(skill.name==='action-home'){setFocusKey(null);setActiveWork(null);setReading(false);go('hero');}
    else if(skill.name==='action-experience'){setFocusKey(null);setActiveWork(null);setReading(false);go('experience');}
    else if(skill.name==='action-achievements'){setFocusKey(null);setActiveWork(null);setReading(false);go('experience');}
    else if(skill.name==='action-projects'){setFocusKey(null);setActiveWork(null);setReading(false);go('projects');}
    else if(skill.name==='action-contact'){setFocusKey(null);setActiveWork(null);setReading(false);go('contact');}
    else if(skill.name==='action-about')setOverlay('about');
    else if(skill.name==='action-skills')setOverlay('about');
    else setDetail(skill);
  },[]);
  const closeFocus=useCallback(()=>{setFocusKey(null);setActiveWork(null);setReading(false);},[]);
  const selectWork=useCallback((id:WorkId)=>{setPlayful(false);setReading(false);setActiveWork(id);setFocusKey('work-'+id);},[]);
  const openWorkFromGallery=useCallback((id:WorkId)=>{
    const region=document.getElementById('skills');
    const rect=region?.getBoundingClientRect();
    const visible=Boolean(rect&&rect.top<innerHeight&&rect.bottom>0);
    if(section==='skills'&&visible){selectWork(id);return;}
    if(!region){selectWork(id);return;}
    pendingWork.current=id;
    selectWork(id);
    if(lenis.current)lenis.current.scrollTo(region,{offset:0,duration:1.15});
    else region.scrollIntoView({behavior:'instant'});
  },[section,selectWork]);
  const close=useCallback(()=>setOverlay(null),[]);
  const go=(id:string)=>{setOverlay(null);requestAnimationFrame(()=>{const target=document.getElementById(id);if(target){if(lenis.current)lenis.current.scrollTo(target,{offset:id==='skills'||id==='hero'?0:-70,duration:1.25});else target.scrollIntoView({behavior:'instant'});}});};
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
    gsap.from('.hero-copy > *',{y:24,filter:'blur(8px)',opacity:0,duration:1.05,stagger:0.13,ease:'expo.out',clearProps:'all'});
    gsap.from('.site-header',{y:-60,duration:0.9,ease:'expo.out',clearProps:'transform'});
    gsap.utils.toArray<HTMLElement>('.section-title').forEach(el=>gsap.from(el,{filter:'blur(10px)',opacity:0.2,duration:0.8,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 85%',once:true},clearProps:'filter,opacity'}));
    gsap.to('.hero-copy,.hero-bottom',{y:-45,autoAlpha:0,ease:'none',scrollTrigger:{trigger:'#hero',start:'55% top',end:'bottom 18%',scrub:true}});
    gsap.to('.skills-stage-inner',{autoAlpha:0,y:-30,ease:'none',scrollTrigger:{trigger:'#skills',start:'bottom 92%',end:'bottom 48%',scrub:true}});
    const progress=document.querySelector('.reading-progress');
    ScrollTrigger.create({start:0,end:'max',onUpdate:self=>gsap.set(progress,{scaleX:self.progress})});
  },{scope:root,dependencies:[reduced],revertOnUpdate:true});
  useEffect(()=>{
    let sequence='';
    const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,textarea,[contenteditable]'))return;sequence=(sequence+e.key.toLowerCase()).slice(-12);if(sequence.endsWith('curiosity')){setParty(true);notify('好奇心已解锁。去按下另一颗键吧。');setTimeout(()=>setParty(false),5000);}};
    window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);if(toastTimer.current)clearTimeout(toastTimer.current);};
  },[notify]);
  useEffect(()=>{if(overlay==='chat')chatEnd.current?.scrollIntoView({block:'nearest'});},[room.messages,overlay]);
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>ScrollTrigger.refresh());
    const observer=new ResizeObserver(()=>ScrollTrigger.refresh());
    document.querySelectorAll('#experience,#projects').forEach(el=>observer.observe(el));
    return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[profile,filter,query,reduced,sceneStatus]);
  useEffect(()=>{
    const surface=ScrollTrigger.create({trigger:'.editorial-world',start:'top 70px',end:'bottom 70px',onToggle:self=>setPaperHeader(self.isActive),onRefresh:self=>setPaperHeader(self.isActive)});
    return()=>surface.kill();
  },[]);
  const saveProfile=(next:Profile)=>{try{localStorage.setItem(PROFILE_KEY,JSON.stringify(next));}catch{throw new Error('本机存储已满，请先导出资料备份。');}setSceneStatus('loading');setProfile(next);notify('资料已保存在当前浏览器。');};
  const sendChat=(event:FormEvent)=>{event.preventDefault();if(!chatText.trim())return;room.send(chatText);setChatText('');};
  const entries=profile.entries.filter(e=>(filter==='all'||e.category===filter)&&`${e.title} ${e.description} ${e.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const experiences=profile.entries.filter(e=>['experience','achievement'].includes(e.category));
  const displayName=profile.name==='等你写下名字'?'Your Name':profile.name;
  const words=displayName.split(/\s+/);
  const showFallback=reduced||sceneStatus==='failed';
  useKineticSurface(root,reduced,`${displayName}:${filter}:${query}:${profile.entries.length}:${sceneStatus}:${playful}`);
  return <div ref={root} className={`space-app kinetic-app ${showFallback?'static-scene':''} ${party?'easter-active':''}`}>
    <OpeningSequence reduced={reduced} replayKey={replayKey}/>
    <a href="#main" className="skip-link">跳到主要内容</a><div className="reading-progress" aria-hidden="true"/>
    <div className="cosmos" aria-hidden="true">{stars.map((style,i)=><i key={i} style={style}/>)}</div>
    <ParticleField disabled={reduced}/>
    {!reduced&&skills.length>0&&<div className="scene-layer" data-section={section}><SceneBoundary onFail={fail}><Suspense fallback={null}><KeyboardScene key={JSON.stringify(skills)} skills={skills} sound={sound} playful={playful} petSignal={petSignal} rotationSignal={rotationSignal} focusKey={focusKey} onReady={onReady} onSelect={onSelect} onSection={onSection} onOpen={onOpen}/></Suspense></SceneBoundary></div>}
    <header className={`site-header ${paperHeader?'on-paper':''}`}><a href="#hero" className="wordmark" onClick={e=>{e.preventDefault();go('hero');}}><BrandMark/><span className="wordmark-type">{profile.isDemo?'OPEN':profile.name}<span>SPACE</span></span></a><div className="header-actions">
      <div className="theme-wrap"><button className="icon-button bare" aria-label="切换主题" aria-expanded={themeMenu} onClick={()=>setThemeMenu(!themeMenu)}><Icon name={theme==='light'?'sun-2-linear':'moon-linear'}/></button>{themeMenu&&<div className="theme-menu" role="group" aria-label="主题选项">{[['dark','深空'],['light','日光'],['system','跟随系统']].map(([value,label])=><button key={value} aria-pressed={theme===value} onClick={()=>{setTheme(value);setThemeMenu(false);notify(value==='light'?'日光模式。星星还在，只是藏起来了。':'主题已切换。');}}>{label}</button>)}</div>}</div>
      <button className="icon-button game-trigger" aria-label="打开键盘小游戏" onClick={()=>setOverlay('game')}><Icon name="gamepad-linear"/></button>
      <button className="icon-button people-button" aria-label={`打开聊天，${room.peers.length+1} 人${room.mode==='online'?'在线':'在本地房间'}`} onClick={()=>setOverlay('chat')}><Icon name="users-group-rounded-linear"/><span>{room.peers.length+1}</span></button>
      <a className="source-link" href="https://github.com/youq790-del/personal-atlas" target="_blank" rel="noreferrer"><Icon name="code-circle-linear"/><span>Source</span></a>
      <button className="menu-button" onClick={()=>setOverlay('menu')} aria-label="打开导航菜单"><span>Menu</span><i aria-hidden="true"/></button>
    </div></header>
    <main id="main">
      <section id="hero" className="hero-section">
        <div className="hero-copy">
          <h1 aria-label={displayName} className={words.length===1?'single-name':''}>{words.map((word,i)=><span className="name-line" aria-hidden="true" key={i}><ElasticText text={word}/>{i===words.length-1&&<span className="name-period">.</span>}</span>)}</h1>
          <p className="hero-role">{profile.role}</p>
          <div className="hero-actions"><button className="editorial-link" onClick={()=>setOverlay('about')}><span>关于</span><Icon name="arrow-right-up-linear"/></button><button className="editorial-link subtle" onClick={()=>go('contact')}><span>联系</span><Icon name="arrow-right-up-linear"/></button></div>
          {profile.isDemo&&<button className="profile-note" onClick={()=>setOverlay('editor')}>资料待填 <Icon name="arrow-right-up-linear" size={14}/></button>}
        </div>
        {showFallback&&<img className="keyboard-poster" src={asset('assets/keyboard/keyboard-poster.jpg')} alt="彩色机械键盘，技能目录在下方"/>}
        <div className="hero-bottom"><span className="hero-caption" data-kinetic>拖拽旋转 · 点击探索</span><button className="scroll-invitation" onClick={()=>go('skills')} aria-label="向下探索技能"><span>Explore</span><Icon name="arrow-down-linear"/></button><div className="hero-utilities"><button aria-label={sound?'关闭键盘声音':'开启键盘声音'} aria-pressed={sound} onClick={()=>setSound(!sound)}><span className={sound?'sound-bars active':'sound-bars'} aria-hidden="true"><i/><i/><i/></span>{sound?'ON':'OFF'}</button><button aria-label="打开技能键位目录" onClick={()=>setOverlay('directory')}>键位<Icon name="arrow-right-up-linear" size={15}/></button></div></div>
      </section>
      <section id="skills" className={`skills-section ${showFallback?'fallback-skills':''} ${focusKey?'is-exploring':''}`}>
        <div className="skills-stage"><div className="skills-stage-inner">
          <div className="section-title skills-heading"><h2><ElasticText text={activeWork?workById(activeWork)?.word||'Made.':reading?'Words.':playful?'Hello.':selected?workById(selected.name.replace(/^work-/,''))?.word||'Tap.':'Play.'}/></h2><p>{focusKey?'正在探索':'3D 练习 · Blender'}</p></div>
          <div className="skill-readout"><div aria-live="polite"><strong>{playful?'Hello, little friend.':selected?.label||'触碰，发现。'}</strong><p>{showFallback?'点击 / Tab + Enter':playful?'轻触小猫 · 移动鼠标':'拖拽旋转 · 点按键帽'}</p></div><div className="skill-controls">{!showFallback&&<><button className="text-link" aria-pressed={playful} onClick={()=>setPlayful(!playful)}>{playful?'键盘':'小猫'}</button>{playful?<button className="text-link" onClick={()=>setPetSignal(v=>v+1)}>摸摸它</button>:<button className="text-link" onClick={()=>setRotationSignal(v=>v+1)}>旋转</button>}</>}<button className="editorial-link" onClick={()=>setOverlay('directory')}><span>键位</span><Icon name="arrow-right-up-linear"/></button></div></div>
          <nav className="skills-key-index" aria-label="打开作品与文章">{works.map(work=><button key={work.id} onClick={()=>selectWork(work.id)} style={{'--swatch':work.color} as React.CSSProperties}>{work.keyLabel}</button>)}<button onClick={()=>onOpen(writingKey)} style={{'--swatch':writingKey.color} as React.CSSProperties}>文章</button></nav>
        </div>{(activeWork||reading)&&<WorkStage key={activeWork||'writing'} work={workById(activeWork)} reading={reading} collection={profile.wechat} reduced={reduced} onClose={closeFocus} onWork={selectWork}/>}</div>
        {showFallback&&<div className="skill-static-grid">{skills.map((skill,i)=><button key={skill.name} onClick={()=>onOpen(skill)} style={{'--key-color':skill.color} as React.CSSProperties}>{skill.icon?<img src={skill.icon} alt=""/>:<Icon name="widget-2-linear"/>}<span>{skill.label}</span><kbd>{shortcuts[i]?.replace(/^(Key|Digit)/,'')||'点击'}</kbd></button>)}</div>}
      </section>
      <div className="editorial-world"><FieldBackdrop disabled={reduced}/>
      <section id="experience" className="experience-section">
        <SeamTransition reduced={reduced}/>
        <div className="story-intro"><h2 className="section-title"><ElasticText text="Traces."/></h2><div className="story-orbit"><KineticArtwork variant={1}/><span className="story-context">经历 / 成就{profile.isDemo?' · 示意':''}</span></div></div>
        <div className="experience-stack">{experiences.map(entry=><details key={entry.id} className="experience-row" onToggle={()=>ScrollTrigger.refresh()}><summary><ElasticLine/><span className="experience-category">{categories[entry.category]}{profile.isDemo?' · 示意':''}</span><div><h3><ElasticText text={profile.isDemo?(entry.category==='achievement'?'里程碑':'来时路'):entry.title}/></h3></div><span className="row-toggle"><Icon name="arrow-right-up-linear"/></span></summary><div className="experience-story"><p>{entry.detail}</p><div className="tags">{entry.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></details>)}</div>
      </section>
      <section id="projects" className="projects-section"><ElasticLine/><div className="section-title"><h2><ElasticText text="Made."/></h2><p>Blender 练习与个人作品</p></div><PortfolioGallery onOpen={openWorkFromGallery} reduced={reduced}/><div className="portfolio-writing"><WeChatShelf collection={profile.wechat} compact reduced={reduced}/></div><div className="project-tools"><div className="filters" role="group" aria-label="筛选档案">{[['all','全部'],...Object.entries(categories)].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div><label className="search-box"><Icon name="magnifier-linear"/><input aria-label="搜索档案" placeholder="搜索档案" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><div className="projects-grid">{entries.map((entry,i)=><button key={entry.id} className={`project-card project-${entry.category}`} onClick={()=>setDetail(entry)}><div className="project-preview"><ElasticFrame variant={i+2} disabled={reduced}>{entry.image&&safeUrl(entry.image,true)?<img src={safeUrl(entry.image,true)} alt={entry.title}/>:<div className="project-art"><KineticArtwork variant={i}/><span className="project-art-note">{profile.isDemo?'内容示意':entry.label}</span></div>}</ElasticFrame></div><div className="project-caption"><h3>{profile.isDemo?({project:'创造',achievement:'生长',experience:'行走',note:'好奇'}[entry.category]):entry.title}</h3><span>{categories[entry.category]}{profile.isDemo?' / 示意':''}</span></div><span className="project-open"><Icon name="arrow-right-up-linear"/></span></button>)}</div>{!entries.length&&<div className="empty-state"><p>没有匹配的档案。</p><button className="button secondary" onClick={()=>{setFilter('all');setQuery('');}}>清除筛选</button></div>}<p className="project-count" aria-live="polite">{entries.length} 条{profile.isDemo?'内容示意':'档案'}</p></section>
      </div>
      <section id="contact" className="contact-section"><ElasticLine/><div className="section-title"><h2><ElasticText text="Say"/><br/><ElasticText text="hello."/></h2></div><div className="contact-layout"><div className="contact-card"><p className="muted">{profile.email?`你可以直接写信至 ${profile.email}，或在这里准备邮件。`:room.mode==='online'?'联系方式正在整理。你可以和当前在线的访客聊两句。':'本地聊天演示 · 不会发送给站点主人。'}</p>{profile.email?<form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);location.href=`mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent(`来自 ${data.get('name')} 的问候`)}&body=${encodeURIComponent(`${data.get('message')}\n\n回复邮箱：${data.get('email')}`)}`;}}><div className="form-pair"><label>你的名字<input required name="name" placeholder="怎么称呼你"/></label><label>邮箱<input required name="email" type="email" placeholder="you@example.com"/></label></div><label>想聊什么<textarea required name="message" rows={4} placeholder="一个想法，或一句你好。"/></label><button className="button primary" type="submit">打开邮件客户端<Icon name="arrow-right-linear"/></button></form>:<div className="contact-empty"><Icon name="chat-round-dots-linear" size={36}/><button className="button primary" onClick={()=>setOverlay('chat')}>{room.mode==='online'?'打开访客聊天室':'体验本地聊天室'}<Icon name="arrow-right-linear"/></button><button className="text-link" onClick={()=>setOverlay('editor')}>添加我的联系方式</button></div>}</div></div></section>
    </main>
    <footer><span>© {new Date().getFullYear()} {profile.isDemo?'我的个人空间':profile.name}</span><button className="text-link" onClick={()=>setOverlay('editor')}>编辑资料</button><a href="https://github.com/Naresh-Khatri/3d-portfolio" target="_blank" rel="noreferrer">Based on Naresh Khatri · MIT</a><button className="icon-button bare" aria-label="回到顶部" onClick={()=>go('hero')}><Icon name="arrow-up-linear"/></button></footer>
    {sceneStatus==='loading'&&!reduced&&<div className="scene-loading" role="status"><span/>正在组装键盘</div>}
    {room.peers.filter(p=>p.x!==undefined).map(peer=><div className="remote-cursor" key={peer.id} style={{left:`${(peer.x||0)*100}%`,top:`${(peer.y||0)*100}%`,color:peer.color}}><Icon name="cursor-bold"/><span style={{background:peer.color}}>{peer.name}</span></div>)}
    <AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:10,opacity:0}}>{toast}<button aria-label="关闭提示" onClick={()=>setToast('')}><Icon name="close-circle-linear" size={16}/></button></motion.div>}</AnimatePresence>
    {overlay==='menu'&&<Modal title="Explore" onClose={close} wide className="nav-modal"><nav className="expanded-nav" aria-label="主要导航">{sections.map(([id,label,en],i)=><motion.button key={id} initial={reduced?false:{y:30,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:i*.06}} onClick={()=>go(id)}><span>{en}</span><small>{label}</small></motion.button>)}</nav><div className="menu-bottom"><button className="text-link" onClick={()=>{setOverlay(null);go('hero');setReplayKey(k=>k+1);}}>重播开场</button><button className="text-link" onClick={()=>setOverlay('editor')}>编辑个人资料</button><button className="text-link" onClick={()=>setOverlay('game')}>键盘小游戏</button><button className="text-link" aria-pressed={quiet} onClick={()=>setQuiet(!quiet)}>{quiet?'恢复动画':'减少动态效果'}</button></div></Modal>}
    {overlay==='directory'&&<Modal title="每一颗键，都有故事。" onClose={close} wide className="directory-modal"><p className="muted">点击，或用 Tab + Enter 打开内容。{!showFallback&&'关闭目录后，可使用键位旁标注的实体按键。'}</p><div className="skill-static-grid">{skills.map((skill,i)=><button key={skill.name} onClick={()=>{close();onOpen(skill);}} style={{'--key-color':skill.color} as React.CSSProperties}>{skill.icon?<img src={skill.icon} alt=""/>:<Icon name="widget-2-linear"/>}<span>{skill.label}</span><kbd>{shortcuts[i]?.replace(/^(Key|Digit)/,'')||'点击'}</kbd></button>)}</div></Modal>}
    {overlay==='editor'&&<Editor profile={profile} onSave={saveProfile} onClose={close}/>}
    {overlay==='about'&&<Modal title={profile.isDemo?'认识未来的我':profile.name} onClose={close} wide><p className="about-role">{profile.role}</p><p className="about-bio">{profile.bio}</p><div className="about-facets">{['traits','interests','skills'].map(key=><div key={key}><h3>{key==='traits'?'我的特点':key==='interests'?'我的热爱':'我的能力'}</h3><p className="muted">{profile.facets[key].description}</p><div className="tags">{profile.facets[key].tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>)}</div>{profile.isDemo&&<button className="button primary" onClick={()=>setOverlay('editor')}>填入我的故事</button>}</Modal>}
    {overlay==='game'&&<Modal title="键盘反应挑战" onClose={close}><MiniGame/></Modal>}
    {overlay==='chat'&&<Modal title="访客聊天室" onClose={close}><div className="room-status"><span className={`status-light ${room.mode==='online'?'online':''}`}/><span>{room.mode==='online'?'实时连接':room.mode==='connecting'?'正在连接 · 本地可用':'本地房间'} · {room.peers.length+1} 人</span></div><p className="muted small">{room.mode==='online'?'当前房间的访客可以实时聊天。消息仅在本次会话中保留。':'当前仅同一浏览器的标签页互通；公网聊天室尚未连接。消息不会发送给站点主人。'}</p><div className="chat-log" role="log" aria-live="polite">{!room.messages.length&&<div className="chat-empty"><Icon name="chat-round-dots-linear" size={40}/><p>还没有对话。</p><span>从一句“你好”开始吧。</span></div>}{room.messages.map(m=><div className={`chat-message ${m.id===room.me.id?'mine':''}`} key={m.messageId}><small style={{color:m.color}}>{m.id===room.me.id?'你':m.name}</small><p>{m.text}</p></div>)}<div ref={chatEnd}/></div><form className="chat-form" onSubmit={sendChat}><input aria-label="聊天消息" placeholder="说点什么…" maxLength={500} value={chatText} onChange={e=>setChatText(e.target.value)}/><button className="icon-button" type="submit" aria-label="发送消息" disabled={!chatText.trim()}><Icon name="plain-linear"/></button></form></Modal>}
    {detail&&<Modal title={'label'in detail&&'name'in detail?detail.label:('title'in detail?detail.title:'键位介绍')} onClose={()=>setDetail(null)} wide>{'color'in detail&&<div className="detail-key" style={{background:detail.color}}>{detail.icon?<img src={detail.icon} alt=""/>:<Icon name="keyboard-linear" size={42}/>}</div>}<p className="detail-copy">{detail.detail}</p>{'tags'in detail&&<div className="tags">{detail.tags.map(t=><span key={t}>{t}</span>)}</div>}{'url'in detail&&detail.url&&safeUrl(detail.url)&&<a className="button primary" href={safeUrl(detail.url)} target="_blank" rel="noreferrer">查看作品<Icon name="arrow-right-up-linear"/></a>}{(('demo'in detail&&detail.demo)||profile.isDemo)&&<p className="muted small">内容示意 · 真实个人资料待补充</p>}</Modal>}
  </div>;
}



