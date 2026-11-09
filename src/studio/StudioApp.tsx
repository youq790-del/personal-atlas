import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { Editor } from '../Editor';
import { ArticleReader } from '../WeChatShelf';
import { WorkFilm } from '../WorkFilm';
import { loadProfile, profileIdentity, isTemplateEntry, PROFILE_KEY, safeUrl, type Profile } from '../data';
import { works, workAsset } from '../portfolio';
import { usePublishedWriting } from '../usePublishedWriting';
import { wechatLink, wechatReader, type WeChatArticle } from '../wechat';
import { BuildCursors, BuildType, SelectionHandles } from './BuildPrimitives';
import { StudioCatalog } from './StudioCatalog';
import { useRebuild } from './useRebuild';
import './studio.css';

const paths=[['canvas','画布'],['work','影像'],['notes','笔记'],['about','关于我']];
const questions=[
  {id:'wx-e9a08c5b62806c95',word:'晃动',symbol:'↔',question:'换成手提，就稳了？',note:'手提时晃动小了，但究竟哪种作用占主导，还不能确定。',quote:'但换成手提，改变的其实不只是阻尼。',tag:'生活里的物理'},
  {id:'writing-a06',word:'平方',symbol:'²',question:'怎么又是平方？',note:'从能量的平方项，追问到波的速度和材料的色散。',quote:'这个平方结构难道有什么特殊性吗',tag:'物理笔记'},
  {id:'writing-a04',word:'弯曲',symbol:'∿',question:'为什么偏偏是马鞍面？',note:'滤纸和产物一起弯了。先比较现象，再试着解释形状。',quote:'但单独滤纸重复操作并不会产生如此大的弯折',tag:'实验观察'},
];

function useMotionPreference() {
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  return reduced;
}

export default function StudioApp() {
  const root=useRef<HTMLDivElement>(null),lenis=useRef<Lenis|null>(null);
  const [profile,setProfile]=useState(loadProfile);
  const identity=useMemo(()=>profileIdentity(profile),[profile]);
  const writing=usePublishedWriting(profile.wechat,profile.wechatAutoUpdate);
  const articles=useMemo(()=>(writing?.articles||[]).filter(a=>wechatLink(a.url)||a.body||wechatReader(a.readerPath)),[writing]);
  const entries=useMemo(()=>profile.entries.filter(entry=>!isTemplateEntry(entry)),[profile]);
  const systemReduced=useMotionPreference();
  const [quiet,setQuiet]=useState(false),[paused,setPaused]=useState(false),[skipped,setSkipped]=useState(false),[replay,setReplay]=useState(0);
  const reduced=systemReduced||quiet;
  const [progress,setProgress]=useState({completed:0,total:0});
  const onProgress=useCallback((completed:number,total:number)=>setProgress({completed,total}),[]);
  const [activeSection,setActiveSection]=useState('canvas');
  const [reader,setReader]=useState<WeChatArticle|null>(null),[editing,setEditing]=useState(false),[contact,setContact]=useState(false);
  const [query,setQuery]=useState(''),[archive,setArchive]=useState(false),[copied,setCopied]=useState(false),[copyFailed,setCopyFailed]=useState(false);
  const [dark,setDark]=useState(()=>{try{return localStorage.getItem('yo7-studio-theme')==='dark';}catch{return false;}});
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [profileLayer,setProfileLayer]=useState<'study'|'visual'|'daily'>('study');
  const [dialogOpen,setDialogOpen]=useState(false);
  useRebuild(root,{reduced,paused:paused||dialogOpen,replay,skip:skipped,onProgress});
  const percent=progress.total?Math.round(progress.completed/progress.total*100):0;
  const finished=progress.total>0&&progress.completed>=progress.total;
  useEffect(()=>{if(finished)setPaused(false);},[finished]);
  const read=useCallback((id:string)=>{const article=articles.find(item=>item.id===id);if(article)setReader(article);},[articles]);

  useEffect(()=>{
    document.documentElement.dataset.theme=dark?'dark':'light';
    document.documentElement.dataset.studioTheme=dark?'dark':'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#191c24':'#f4f5f8');
    try{localStorage.setItem('yo7-studio-theme',dark?'dark':'light');}catch{}
  },[dark]);
  useEffect(()=>{
    if(reduced)return;
    const scroll=new Lenis({duration:.9,smoothWheel:true,anchors:{offset:-85}});lenis.current=scroll;
    const tick=(time:number)=>{if(!document.hidden)scroll.raf(time*1000);};gsap.ticker.add(tick);
    return()=>{gsap.ticker.remove(tick);scroll.destroy();lenis.current=null;};
  },[reduced]);
  useEffect(()=>{
    const sync=()=>{const open=!!document.querySelector('dialog[open]');setDialogOpen(open);if(open)lenis.current?.stop();else lenis.current?.start();};
    const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['open'],childList:true,subtree:true});sync();
    return()=>observer.disconnect();
  },[reduced]);
  useEffect(()=>{
    const elements=paths.map(([id])=>document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const positions=new Map<string,boolean>();
    const observer=new IntersectionObserver(items=>{items.forEach(item=>positions.set(item.target.id,item.isIntersecting));const visible=elements.filter(el=>positions.get(el.id));if(visible.length)setActiveSection(visible[0].id);},{rootMargin:'-18% 0px -52% 0px'});
    elements.forEach(el=>observer.observe(el));return()=>observer.disconnect();
  },[]);
  useEffect(()=>()=>{if(copyTimer.current)clearTimeout(copyTimer.current);},[]);
  const replayBuild=()=>{setSkipped(false);setPaused(false);setReplay(value=>value+1);if(lenis.current)lenis.current.scrollTo(0,{immediate:true});else window.scrollTo({top:0,behavior:'instant'});};
  const save=(next:Profile)=>{localStorage.setItem(PROFILE_KEY,JSON.stringify(next));setProfile(next);};
  const copyAccount=async()=>{
    try{await navigator.clipboard.writeText(writing?.accountId||'gh_29c0b927a35c');setCopied(true);setCopyFailed(false);if(copyTimer.current)clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopied(false),2500);}
    catch{setCopyFailed(true);}
  };
  const filtered=articles.filter(article=>`${article.title} ${article.body||''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const grass=works.find(work=>work.id==='grass')!;
  const pop=works.find(work=>work.id==='pop')!;
  const profileViews={study:{title:'在学',text:identity.facets.skills.description,tags:identity.facets.skills.tags},visual:{title:'Blender',text:identity.facets.interests.description,tags:identity.facets.interests.tags},daily:{title:'课外',text:identity.facets.traits.description,tags:identity.facets.traits.tags}};
  const view=profileViews[profileLayer];

  return <div ref={root} className={'studio-app'+(reduced?' studio-still':'')}>
    <a className="studio-skip" href="#work">跳到作品</a>
    <header className="studio-header">
      <a className="studio-logo" href="#canvas" aria-label="回到首页">{identity.name}<span className="studio-logo-dot"/></a>
      <div className="studio-file-name"><Icon name="document-text-linear" size={16}/><span>我的一页</span><span className="studio-file-extension">.canvas</span></div>
      <nav aria-label="主导航">{paths.slice(1).map(([id,label])=><a key={id} href={'#'+id} aria-current={activeSection===id?'location':undefined}>{label}</a>)}</nav>
      <button className="studio-icon-button" onClick={()=>setDark(value=>!value)} aria-label={dark?'切换为浅色画布':'切换为深色画布'} aria-pressed={dark}><Icon name={dark?'sun-2-linear':'moon-linear'} size={19}/></button>
      <button className="studio-contact-button" onClick={()=>setContact(true)}>联系<Icon name="arrow-right-up-linear" size={16}/></button>
    </header>
    <aside className="studio-layer-rail" aria-label="页面图层">
      <span className="studio-rail-title">图层</span>{paths.map(([id,label],index)=><a key={id} href={'#'+id} className={activeSection===id?'is-current':''} aria-label={label} aria-current={activeSection===id?'location':undefined}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span><span>{label}</span></a>)}
      <a className="studio-keyboard-link" href="?view=keyboard" aria-label="切换到漫画键盘模式"><Icon name="keyboard-linear" size={21}/><span>键盘模式</span></a>
    </aside>
    <main className="studio-canvas">
      <section id="canvas" className="studio-hero" data-build-section>
        <div className="studio-ruler" aria-hidden="true"><span>0</span><span>200</span><span>400</span><span>600</span><span>800</span><span>1000</span></div>
        <div className="studio-hero-topline"><span><i/> 一份持续更新的个人记录</span><span>移动图像 / 学习笔记</span></div>
        <div className="studio-hero-layout">
          <div className="studio-hero-copy">
            <BuildType as="p" className="studio-hello" text="你好，我是"/>
            <BuildType as="h1" className="studio-name" text={identity.name+'.'}/>
            <BuildType as="p" className="studio-identity" text={identity.role}/>
            <p className="studio-hero-intro" data-build="draw">{identity.intro}</p>
            <a href="#work" className="studio-primary">看我做的东西<Icon name="arrow-down-linear" size={18}/></a>
          </div>
          <div className="studio-hero-composition">
            <div className="studio-hero-film studio-selected" data-build="place">
              <div className="studio-object-label"><span>草地与风.mp4</span><span data-measure/></div>
              <WorkFilm src={workAsset(grass.video!)} poster={workAsset(grass.poster)} title={grass.title} reduced={reduced} suspended={dialogOpen||paused} frameVariant={1} preview rectangular/>
              <SelectionHandles/>
            </div>
            <div className="studio-pop-still" data-build="place"><img src={workAsset(pop.poster)} alt="波普练习中的漫画风格画面" width="220" height="180"/><span>色块、轮廓、试试看。</span></div>
            <div className="studio-annotation" data-build="draw"><Icon name="arrow-left-up-linear" size={20}/><span>这片草地有风。</span></div>
          </div>
        </div>
        <div className="studio-hero-bottom"><div className="studio-demo-identity"><span className="studio-mini-cursors" aria-hidden="true">↖ ↖ ↖</span><span>多光标重建演示<small>按已有内容模拟搭建</small></span></div><a href="#inventory">继续往下<Icon name="arrow-down-linear" size={16}/></a></div>
        <BuildCursors/>
      </section>

      <section id="inventory" className="studio-inventory studio-section" data-build-section aria-label="内容概览">
        <div className="studio-stat" data-build="place"><strong>{String(works.length).padStart(2,'0')}</strong><div><span>组 Blender 练习</span><small>粒子、节点、材质与动画</small></div></div>
        <div className="studio-stat" data-build="place"><strong>{articles.length}</strong><div><span>篇公开笔记</span><small>学到哪，就写到哪</small></div></div>
        <div className="studio-study-tags" data-build="draw"><span>最近在学</span><div>{identity.facets.skills.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>
        <BuildCursors/>
      </section>

      <section id="work" className="studio-work-section studio-section" data-build-section>
        <div className="studio-section-heading"><div><span className="studio-section-path">我的一页 / 影像</span><BuildType as="h2" text="先让它动起来。"/></div><p>一些 Blender 练习。<br/>点开一件，看看里面。</p></div>
        <StudioCatalog reduced={reduced} suspended={dialogOpen||paused} onRead={read} articles={articles}/>
        <BuildCursors/>
      </section>

      <section id="notes" className="studio-notes studio-section" data-build-section>
        <div className="studio-section-heading"><div><span className="studio-section-path">我的一页 / 笔记</span><BuildType as="h2" text="这里还没想完。"/></div><p>{writing?.name||'yo7的堂吉诃德'}<br/>{articles.length} 篇，保留原文。</p></div>
        <div className="studio-question-grid">{questions.filter(question=>articles.some(article=>article.id===question.id)).map(question=><article className="studio-question" key={question.id} data-build="place">
          <span className="studio-question-tag">{question.tag}</span><div className="studio-question-art" aria-hidden="true"><span>{question.word}</span><b>{question.symbol}</b></div>
          <h3><button onClick={()=>read(question.id)}>{question.question}<Icon name="arrow-right-up-linear" size={19}/></button></h3><p>{question.note}</p>
          <details><summary>原文里的一句</summary><blockquote>{question.quote}</blockquote><button className="studio-text-link" onClick={()=>read(question.id)}>继续读</button></details>
        </article>)}</div>
        <div className="studio-archive" data-build="draw">
          <div className="studio-archive-toolbar"><button aria-expanded={archive} onClick={()=>setArchive(value=>!value)}>{archive?'收起目录':'全部笔记'}<span>{articles.length}</span><Icon name={archive?'arrow-up-linear':'arrow-down-linear'} size={18}/></button><label><Icon name="magnifier-linear" size={17}/><input aria-label="搜索全部笔记" placeholder="找一篇笔记" value={query} onChange={event=>{setQuery(event.target.value);setArchive(true);}}/></label></div>
          <ul className="studio-article-list">{(archive||query?filtered:filtered.slice(0,3)).map(article=><li key={article.id}><button onClick={()=>read(article.id)}><time dateTime={article.publishedAt}>{article.publishedAt?.replaceAll('-','.')||'笔记'}</time><span>{article.title}</span><Icon name="arrow-right-up-linear" size={18}/></button></li>)}</ul>
          {!filtered.length&&<p className="studio-no-results">没有找到“{query}”，换个词试试。</p>}
        </div>
        <BuildCursors/>
      </section>

      <section id="about" className="studio-about studio-section" data-build-section>
        <div className="studio-section-heading"><div><span className="studio-section-path">我的一页 / 关于我</span><BuildType as="h2" text="页面外的我。"/></div></div>
        <div className="studio-about-layout">
          <div className="studio-about-copy" data-build="draw"><p>{identity.bio}</p><a className="studio-text-link" href="?view=keyboard">换个入口：玩玩键盘<Icon name="arrow-right-up-linear" size={17}/></a></div>
          <div className="studio-profile-layers" data-build="place"><div className="studio-profile-switch" role="group" aria-label="了解我的不同侧面">{(['study','visual','daily'] as const).map(layer=><button aria-pressed={profileLayer===layer} key={layer} onClick={()=>setProfileLayer(layer)}>{profileViews[layer].title}</button>)}</div><div className="studio-profile-view"><p>{view.text}</p><div>{view.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></div>
        </div>
        {entries.length>0&&<div className="studio-personal-entries">{entries.map(entry=><details key={entry.id}><summary>{entry.title}</summary><p>{entry.description}</p><p>{entry.detail}</p>{safeUrl(entry.url)&&<a href={safeUrl(entry.url)} target="_blank" rel="noreferrer">查看链接</a>}</details>)}</div>}
        <div className="studio-goodbye" data-build="draw"><span>先写到这，<br/>下次再补。</span><button onClick={()=>setContact(true)} aria-label="展开联系方式">打个招呼<Icon name="arrow-right-up-linear" size={30}/><SelectionHandles/></button></div>
        <footer className="studio-footer"><span>{identity.name} / 笔记与练习</span><div><a href="https://github.com/youq790-del/personal-atlas" target="_blank" rel="noreferrer">网站源码</a><button onClick={()=>setEditing(true)}>编辑本机资料</button><a href="#canvas">回到页首 ↑</a></div></footer>
        <BuildCursors/>
      </section>
    </main>
    <div className="studio-build-dock" role="region" aria-label="重建演示控制">
      <div className="studio-build-status"><i className={finished?'is-finished':''}/><span>{finished?'搭建完成':paused?'演示已暂停':'页面重建'}<small>{finished?'自由浏览':paths.find(([id])=>id===activeSection)?.[1]||'画布'}</small></span></div>
      <div className="studio-build-progress" role="progressbar" aria-label="重建完成度" aria-valuemin={0} aria-valuemax={progress.total||1} aria-valuenow={progress.completed} aria-valuetext={`${progress.completed} / ${progress.total} 个内容对象已完成`}><div><i style={{transform:`scaleX(${percent/100})`}}/></div><span>{percent}%</span></div>
      <div className="studio-build-controls">
        {!finished&&!reduced&&<button onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>{paused?'继续':'暂停'}</button>}
        {!finished&&<button className="studio-skip-demo" onClick={()=>setSkipped(true)}>直接浏览<Icon name="arrow-right-linear" size={16}/></button>}
        {finished&&!reduced&&<button onClick={replayBuild}>重播搭建<Icon name="restart-linear" size={16}/></button>}
        <button className="studio-motion-control" onClick={()=>setQuiet(value=>!value)} disabled={systemReduced} aria-pressed={reduced} aria-label={systemReduced?'已跟随系统减少动态':quiet?'开启动效':'减少动态'}><Icon name={reduced?'pause-circle-linear':'play-circle-linear'} size={18}/><span>静览</span></button>
      </div>
    </div>
    {reader&&<ArticleReader article={reader} onClose={()=>setReader(null)}/>}
    {editing&&<Editor profile={profile} onSave={save} onClose={()=>setEditing(false)}/>}
    {contact&&<Modal title="在这里找到我" onClose={()=>setContact(false)} className="studio-contact-dialog"><p className="studio-contact-name">{writing?.name||'yo7的堂吉诃德'}</p><p className="studio-contact-help">微信里搜这个名字，或者复制公众号 ID。</p><div className="studio-account-copy"><code>{writing?.accountId||'gh_29c0b927a35c'}</code><button onClick={copyAccount}>{copied?'已复制':'复制'}<Icon name="copy-linear" size={16}/></button></div>{copyFailed&&<p role="status">没能自动复制，可以选中上方账号复制。</p>}<div className="studio-contact-links"><button onClick={()=>{setContact(false);document.getElementById('notes')?.scrollIntoView({behavior:'instant'});}}>先读一篇</button>{profile.email&&<a href={'mailto:'+encodeURIComponent(profile.email)}>写邮件<Icon name="arrow-right-up-linear" size={16}/></a>}</div></Modal>}
  </div>;
}
