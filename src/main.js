import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { icons } from './icons.js';
import { defaultProfile } from './default-profile.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const storageKey = 'personal-atlas-profile-v1';
const categories = {project:{name:'项目作品',code:'P'},achievement:{name:'成就荣誉',code:'A'},experience:{name:'成长经历',code:'E'},note:{name:'随想记录',code:'N'}};
const clone = (value) => JSON.parse(JSON.stringify(value));
let profile = clone(defaultProfile);
let activeFilter = 'all';
let activeFacet = 'skills';
let lastRandom = -1;
let toastTimer;
let editorOpener;
let lenis;
let rafCallback;
let progressTrigger;
const sectionTriggers = [];
const motion = gsap.matchMedia();
const lifecycle = new AbortController();
const listen = (el, event, handler, options = {}) => el.addEventListener(event, handler, { ...options, signal: lifecycle.signal });

function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach(el => {
    const source = icons[el.dataset.icon];
    if (source) el.innerHTML = `<svg viewBox="0 0 ${source.width || 24} ${source.height || 24}" aria-hidden="true" focusable="false">${source.body}</svg>`;
  });
}
function node(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}
function icon(name, className = '') {
  const el = node('span', className);
  el.dataset.icon = name;
  el.setAttribute('aria-hidden', 'true');
  return el;
}
function safeURL(value) {
  if (!value) return '';
  try { const url = new URL(value); return ['https:','http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function textField(value, name, max, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim()) throw new Error(`“${name}”需要填写文字。`);
  if (value.length > max) throw new Error(`“${name}”不能超过 ${max} 字。`);
  return value.trim();
}
function tagsField(value, name) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) throw new Error(`“${name}”应是最多 20 项的文字数组。`);
  return value.map(v => textField(v, name, 60));
}
function validateProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('文件内容应是一个档案对象，请使用下载的模板。');
  if (raw.version !== 1) throw new Error('档案格式版本不匹配，请使用 version 为 1 的本站模板。');
  const clean = {version:1,isDemo:raw.isDemo === true,name:textField(raw.name,'名字',40),role:textField(raw.role,'身份',80),intro:textField(raw.intro,'首页欢迎语',240),bio:textField(raw.bio,'关于我',1000),email:textField(raw.email,'邮箱',150,true)};
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('邮箱格式不正确，请检查后重新导入。');
  if (!Array.isArray(raw.entries) || raw.entries.length > 200) throw new Error('entries 应是最多 200 项的档案数组。');
  clean.entries = raw.entries.map((item,i) => {
    if (!item || typeof item !== 'object' || !Object.hasOwn(categories,item.category)) throw new Error(`第 ${i+1} 条档案的类别应为 project、achievement、experience 或 note。`);
    const url = textField(item.url,'作品链接',2000,true);
    if (url && !safeURL(url)) throw new Error(`第 ${i+1} 条档案请使用完整的 http 或 https 链接。`);
    return {id:`entry-${i+1}`,category:item.category,title:textField(item.title,`第 ${i+1} 条标题`,120),description:textField(item.description,'简介',300,true),detail:textField(item.detail,'详细内容',5000,true),label:textField(item.label,'时间或简短标签',80,true),tags:tagsField(item.tags,'档案标签'),url:safeURL(url)};
  });
  clean.facets = {};
  for (const key of ['skills','traits','interests']) {
    const item = raw.facets?.[key];
    if (!item || typeof item !== 'object') throw new Error(`请补充 facets.${key}，可参照完整模板。`);
    clean.facets[key] = {caption:textField(item.caption,'切面说明',80),title:textField(item.title,'切面标题',120),description:textField(item.description,'切面介绍',1000),tags:tagsField(item.tags,'切面标签')};
  }
  return clean;
}
function announce(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4000);
}
function persist() {
  try { localStorage.setItem(storageKey,JSON.stringify(profile)); return true; }
  catch { $('#editor-status').textContent = '预览已更新，但浏览器无法保存。请导出档案文件，避免丢失。'; return false; }
}
function refreshLayout() {
  requestAnimationFrame(() => { lenis?.resize(); ScrollTrigger.refresh(); });
}
function renderEntries() {
  const list = $('#archive-list');
  const fragment = document.createDocumentFragment();
  const counts = {};
  profile.entries.forEach((item,index) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    const category = categories[item.category];
    const details = node('details','archive-item');
    details.dataset.category = item.category;
    details.id = `archive-entry-${index}`;
    details.dataset.search = [item.title,item.description,item.detail,...item.tags].join(' ').toLocaleLowerCase();
    const summary = node('summary');
    summary.append(node('span','archive-code',`${category.code}—${String(counts[item.category]).padStart(2,'0')}`));
    const title = node('div','archive-title');
    title.append(node('span','category-label',`${category.name}${profile.isDemo?' / 内容示意':''}`));
    const titleHeading = node('h3','',item.title);
    titleHeading.title = item.title;
    title.append(titleHeading,node('p','',item.description));
    summary.append(title,node('span','archive-type',item.label),icon('add-linear','item-icon'));
    const body = node('div','archive-detail');
    body.append(node('p','',item.detail || '这段故事还在整理中。'));
    const tags = node('div');
    item.tags.forEach(tag => tags.append(node('span','detail-tag',tag)));
    body.append(tags);
    if (item.url) { const link = node('a','detail-link','查看相关链接'); link.href=item.url; link.target='_blank'; link.rel='noopener noreferrer'; link.append(icon('arrow-right-up-linear')); body.append(link); }
    details.append(summary,body); fragment.append(details);
    listen(details,'toggle',refreshLayout);
  });
  list.replaceChildren(fragment);
  hydrateIcons(list);
  $('[data-count="all"]').textContent = String(profile.entries.length).padStart(2,'0');
  applyFilter();
}
function applyFilter() {
  const query = $('#archive-search').value.trim().toLocaleLowerCase();
  let count = 0;
  $$('.archive-item').forEach(el => {
    const show = (activeFilter === 'all' || el.dataset.category === activeFilter) && (!query || el.dataset.search.includes(query));
    el.hidden = !show;
    if (show) count++;
  });
  $('#empty-results').hidden = count > 0;
  const blankArchive = profile.entries.length === 0 && !query;
  $('#empty-results h3').textContent = blankArchive ? '你的档案还没有足迹。' : '这条线索还没有出现。';
  $('#empty-results p').textContent = blankArchive ? '整理好第一条项目、成就或经历后，导入资料开启你的档案。' : '试试其他关键词，或看看全部档案。';
  $('#reset-search').hidden = blankArchive;
  $('#filter-status').textContent = `找到 ${count} 条档案`;
  $('#archive-total').textContent = `${String(count).padStart(2,'0')} 条${profile.isDemo?'内容示意 · 真实故事待写入':'档案 · 持续更新中'}`;
  refreshLayout();
}
function renderFacet(key) {
  const item = profile.facets[key];
  activeFacet = key;
  $$('.facet-tabs button').forEach(button => { const selected = button.dataset.facet === key; button.setAttribute('aria-selected',String(selected));button.tabIndex = selected ? 0 : -1; });
  $('#facet-panel').setAttribute('aria-labelledby',`tab-${key}`);
  $('#facet-caption').textContent = item.caption;
  $('#facet-title').textContent = item.title;
  $('#facet-description').textContent = item.description;
  $('#facet-tags').replaceChildren(...item.tags.map(tag => node('span','',tag)));
  $('#facet-note').textContent = profile.isDemo ? '分类示意，等待你的真实内容' : '每一面，都在继续生长。';
  refreshLayout();
}
function renderProfile() {
  $('#profile-name').textContent = profile.name;
  $('#cover-name').textContent = profile.name;
  $('#profile-role').textContent = profile.role;
  $('#hero-intro').textContent = profile.intro;
  $('#profile-bio').textContent = profile.bio;
  $('#profile-state').textContent = profile.isDemo ? '正在等待你的故事' : '持续更新的个人档案';
  $('#demo-note').hidden = !profile.isDemo;
  document.title = profile.isDemo ? '个人漫画档案 · 连载中' : `${profile.name} · 个人漫画档案`;
  const contact = $('#contact-link');
  contact.replaceChildren(document.createTextNode(profile.email ? '给我写封信' : '留一个联络入口'),icon('arrow-right-up-linear'));
  contact.href = profile.email ? `mailto:${encodeURIComponent(profile.email).replace('%40','@')}` : '#contact-info';
  $('#contact-info-text').textContent = profile.email || '联系方式将在你补充资料后显示。现在，可以先把这个网站收进收藏夹。';
  renderEntries(); renderFacet(activeFacet); hydrateIcons(contact);
  $('#random-button').disabled = !profile.entries.length;
  $('#random-button').setAttribute('aria-label',profile.entries.length ? '随机抽一条档案线索' : '暂无档案，请先导入资料');
  $('#ticket-category').textContent = profile.entries.length ? '下一页，可能有惊喜' : '这份档案，等你开启';
  $('#ticket-title').textContent = '有些相识，\n从偶然开始。';
  $('#ticket-link').href='#archive'; lastRandom=-1;
}

hydrateIcons();
try { const saved = localStorage.getItem(storageKey); if (saved) profile = validateProfile(JSON.parse(saved)); } catch { announce('本地档案未能读取，已显示初始版本。你可以重新导入备份。'); }
renderProfile();
$('#footer-year').textContent = String(new Date().getFullYear());
const progressBar = $('#scroll-progress');
const navigationLinks = $$('.desktop-nav a, #mobile-nav a');
function setCurrentSection(sectionId) {
  navigationLinks.forEach(link => {
    if (link.hash === `#${sectionId}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
progressTrigger = ScrollTrigger.create({
  trigger: document.documentElement,
  start: 0,
  end: 'max',
  onUpdate: self => gsap.set(progressBar, { scaleX: self.progress })
});
['about', 'archive', 'facets', 'contact'].forEach(sectionId => {
  sectionTriggers.push(ScrollTrigger.create({
    trigger: `#${sectionId}`,
    start: 'top 45%',
    end: 'bottom 45%',
    onEnter: () => setCurrentSection(sectionId),
    onEnterBack: () => setCurrentSection(sectionId),
    onLeaveBack: () => { if (sectionId === 'about') setCurrentSection(''); }
  }));
});
const filterButtons = $$('.filter');
filterButtons.forEach(button => listen(button,'click',() => {
  activeFilter=button.dataset.filter;
  filterButtons.forEach(item=>{const selected=item===button;item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected));});
  applyFilter();
}));
listen($('#archive-search'),'input',applyFilter);
function resetFilter() { activeFilter='all';$('#archive-search').value='';filterButtons.forEach(button=>{const selected=button.dataset.filter==='all';button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});applyFilter(); }
listen($('#reset-search'),'click',resetFilter);
const facetButtons = $$('.facet-tabs button');
facetButtons.forEach((button,index) => {
  listen(button,'click',()=>renderFacet(button.dataset.facet));
  listen(button,'keydown',event=>{
    let target;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')target=(index+1)%facetButtons.length;
    if(event.key==='ArrowLeft'||event.key==='ArrowUp')target=(index+facetButtons.length-1)%facetButtons.length;
    if(event.key==='Home')target=0;if(event.key==='End')target=facetButtons.length-1;
    if(target!==undefined){event.preventDefault();renderFacet(facetButtons[target].dataset.facet);facetButtons[target].focus();}
  });
});
listen($('#random-button'),'click',()=>{
  const total=profile.entries.length;if(!total)return;
  let index = Math.floor(Math.random()*total);
  if(total>1 && index===lastRandom)index=(index+1)%total;
  lastRandom=index;
  const entry=profile.entries[index];
  $('#ticket-category').textContent=`${categories[entry.category].name}${profile.isDemo?' / 内容示意':''}`;
  $('#ticket-title').textContent=entry.title;
  $('#ticket-link').href=`#archive-entry-${index}`;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.fromTo('#random-result',{rotation:-2,y:5},{rotation:innerWidth<761?2:3,y:0,duration:.65,ease:'expo.out',overwrite:true});
});
listen($('#ticket-link'),'click',()=>{
  if(lastRandom<0)return;
  resetFilter(); const target=$(`#archive-entry-${lastRandom}`);if(!target)return;
  target.open=true;
  requestAnimationFrame(()=>{$('summary',target).focus({preventScroll:true});lenis ? lenis.scrollTo(target,{offset:-35}) : target.scrollIntoView({block:'start',behavior:'instant'});});
});
const mobileNav=$('#mobile-nav');
const menuButton=$('.menu-toggle');
function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');$('.sr-only',menuButton).textContent='展开导航';}
listen(menuButton,'click',()=>{const open=mobileNav.hidden;mobileNav.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));$('.sr-only',menuButton).textContent=open?'收起导航':'展开导航';refreshLayout();});
$$('a',mobileNav).forEach(link=>listen(link,'click',closeMenu));
listen(document,'keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});

const editor=$('#editor');
const backdrop=$('#editor-backdrop');
function openEditor(event){editorOpener=event.currentTarget;$('#editor-status').textContent='';$('#reset-confirm').hidden=true;for(const key of ['name','role','intro','bio','email'])$('#profile-form').elements[key].value=profile[key];editor.hidden=false;backdrop.hidden=false;editor.setAttribute('role','dialog');editor.setAttribute('aria-modal','true');editor.setAttribute('data-lenis-prevent','');document.body.classList.add('editor-open');lenis?.stop();$('#close-editor').focus();}
function closeEditor(){editor.hidden=true;backdrop.hidden=true;document.body.classList.remove('editor-open');lenis?.start();editorOpener?.focus();}
$$('.editor-trigger').forEach(button=>listen(button,'click',openEditor));
listen($('#close-editor'),'click',closeEditor);listen(backdrop,'click',closeEditor);
listen(editor,'keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeEditor();return;}
  if(event.key==='Tab'){const items=$$('a,button,input,textarea,[tabindex="0"]',editor).filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
listen($('#profile-form'),'submit',event=>{
  event.preventDefault();
  const fields=Object.fromEntries(new FormData(event.currentTarget));
  try{
    profile=validateProfile({...profile,...fields});
    const saved=persist();renderProfile();
    $('#editor-status').textContent=saved?'已保存到当前浏览器。发布网站时，请先导出档案文件。':'预览已更新，但浏览器无法保存。请立即导出档案。';
    announce('基本信息已更新。');
  }catch(error){$('#editor-status').textContent=error.message;}
});
listen($('#import-file'),'change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  const control=event.target;control.disabled=true;$('#editor-status').textContent='正在读取档案…';
  try{
    if(file.size>1024*1024)throw new Error('文件超过 1 MB，请缩减文字内容后重试。图片请使用单独的素材文件。');
    let raw;try{raw=JSON.parse((await file.text()).replace(/^\uFEFF/,''));}catch{throw new Error('文件不是有效的 JSON，请检查格式或使用本站模板。');}
    const next=validateProfile(raw);profile=next;const saved=persist();resetFilter();renderProfile();
    for(const key of ['name','role','intro','bio','email'])$('#profile-form').elements[key].value=profile[key];
    $('#editor-status').textContent=`已导入 ${profile.entries.length} 条档案。${saved?'资料保存在当前浏览器。':'浏览器无法保存，请立即导出备份。'}`;
    announce('档案已导入，分类已更新。');
  }catch(error){$('#editor-status').textContent=error.message;}
  finally{control.value='';control.disabled=false;}
});
listen($('#export-profile'),'click',()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:'application/json;charset=utf-8'}));
  const anchor=node('a');anchor.href=url;anchor.download='my-personal-atlas.json';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('#editor-status').textContent='档案已导出。请保留此文件作为备份，或将它交给我更新公开网站。';
});
listen($('#reset-profile'),'click',()=>{$('#reset-confirm').hidden=false;$('#confirm-reset').focus();});
listen($('#cancel-reset'),'click',()=>{$('#reset-confirm').hidden=true;$('#reset-profile').focus();});
listen($('#confirm-reset'),'click',()=>{try{localStorage.removeItem(storageKey);}catch{}profile=clone(defaultProfile);resetFilter();renderProfile();closeEditor();announce('已恢复内容示意。');});

// Exactly one smooth-scroll engine: Lenis. Native scroll is used under reduced motion.
motion.add('(prefers-reduced-motion: no-preference)',()=>{
  lenis=new Lenis({duration:1.05,smoothWheel:true,syncTouch:false,anchors:true});
  lenis.on('scroll',ScrollTrigger.update);
  rafCallback=(time)=>{if(!document.hidden)lenis?.raf(time*1000);};
  gsap.ticker.add(rafCallback);gsap.ticker.lagSmoothing(0);
  const intro=gsap.timeline({defaults:{ease:'expo.out',duration:1}});
  intro.from('.hero-line',{y:24,stagger:.1},0).from('.hero-intro',{y:12},.15).from('.index-stack',{y:28,rotation:-3},.1).from('.hero-copy>.solid-button',{y:9},.3);
  const reelMotion = gsap.matchMedia();
  reelMotion.add('(min-width: 761px)', () => {
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.reel-section',
        start: 'top top+=94px',
        end: '+=155%',
        pin: '.reel-pin',
        scrub: .8,
        invalidateOnRefresh: true
      }
    })
      .from('.reel-stage', { scale: .84, borderRadius: 18, y: 34 }, 0)
      .from('.reel-title-line', { yPercent: 115, stagger: .12, clipPath: 'inset(0 0 100% 0)' }, .08)
      .from('.reel-kicker, .reel-copy>p, .reel-link', { y: 22, stagger: .08, opacity: 0 }, .24)
      .from('.reel-art', { scale: .68, rotation: 8, x: 48 }, .08)
      .from('.reel-card-back', { x: 34, y: 30, rotation: 18 }, .14)
      .from('.reel-card-mid', { x: 22, y: 16, rotation: 10 }, .2)
      .from('.reel-card-front', { x: 12, y: 8, rotation: -6 }, .26)
      .to('.reel-ring-outer', { rotation: 34 }, .12)
      .to('.reel-orbit-label', { y: -12, stagger: .04 }, .2);
  });
  const aboutHeading = $('#about .word-reveal');
  aboutHeading.setAttribute('aria-label', aboutHeading.textContent.trim().replace(/\s+/g, ' '));
  const walker = document.createTreeWalker(aboutHeading, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(text => {
    if (!text.textContent.trim()) return;
    const fragment = document.createDocumentFragment();
    text.textContent.split(/(\s+)/).forEach(word => {
      const span = node('span', 'reveal-word', word);
      span.style.display = /^\s+$/.test(word) ? 'inline' : 'inline-block';
      span.setAttribute('aria-hidden', 'true');
      fragment.append(span);
    });
    text.replaceWith(fragment);
  });
  gsap.from($$('.reveal-word', aboutHeading), {
    y: 20, stagger: .075, duration: .9, ease: 'expo.out',
    scrollTrigger: { trigger: aboutHeading, start: 'top 86%', once: true }
  });
  gsap.from('#archive .section-heading h2', {
    clipPath: 'inset(0 0 100% 0)', y: 18, duration: 1.05, ease: 'expo.out',
    scrollTrigger: { trigger: '#archive .section-heading', start: 'top 78%', once: true }
  });
  gsap.from('.archive-item', {
    y: 20, stagger: .09, duration: .8, ease: 'expo.out',
    scrollTrigger: { trigger: '#archive-list', start: 'top 82%', once: true }
  });
  gsap.from('#facets .facets-heading h2', {
    clipPath: 'inset(0 100% 0 0)', x: -14, duration: .95, ease: 'expo.out',
    scrollTrigger: { trigger: '#facets .facets-heading', start: 'top 82%', once: true }
  });
  gsap.from('.facet-tabs button', {
    x: -16, stagger: .11, duration: .75, ease: 'expo.out',
    scrollTrigger: { trigger: '.facets-layout', start: 'top 82%', once: true }
  });
  gsap.from('#facet-panel', {
    y: 24, rotation: .7, duration: .9, ease: 'expo.out',
    transformOrigin: 'top left', scrollTrigger: { trigger: '#facet-panel', start: 'top 86%', once: true }
  });
  gsap.from('#random-heading', {
    x: -20, duration: .8, ease: 'expo.out',
    scrollTrigger: { trigger: '.serendipity-section', start: 'top 78%', once: true }
  });
  gsap.from('#random-result', {
    y: 34, rotation: -2.5, duration: 1, ease: 'expo.out',
    transformOrigin: 'left bottom', scrollTrigger: { trigger: '#random-result', start: 'top 82%', once: true }
  });
  const contactIntro = gsap.timeline({
    defaults: { ease: 'expo.out' },
    scrollTrigger: { trigger: '#contact', start: 'top 72%', once: true }
  });
  contactIntro.from('#contact h2', { clipPath: 'inset(0 0 100% 0)', y: 22, duration: 1.05 })
    .from('.contact-bottom p, .contact-link', { y: 14, stagger: .13, duration: .7 }, '-=.38');

  const pressableSelector = 'button:not(:disabled), summary, .solid-button, .outline-button, .header-cta, .contact-link';
  const motionListeners = new AbortController();
  let pressedTarget;
  const releaseTarget = () => {
    if (!pressedTarget) return;
    gsap.to(pressedTarget, { scale: 1, duration: .52, ease: 'elastic.out(1,.48)', overwrite: 'auto' });
    pressedTarget = undefined;
  };
  document.addEventListener('pointerdown', event => {
    pressedTarget = event.target.closest(pressableSelector);
    if (pressedTarget) gsap.to(pressedTarget, { scale: .975, duration: .12, ease: 'power2.out', overwrite: 'auto' });
  }, { signal: motionListeners.signal });
  document.addEventListener('pointerup', releaseTarget, { signal: motionListeners.signal });
  document.addEventListener('pointercancel', releaseTarget, { signal: motionListeners.signal });
  document.addEventListener('keydown', event => {
    if (event.repeat || !['Enter', ' '].includes(event.key)) return;
    const target = event.target.closest?.(pressableSelector);
    if (!target) return;
    pressedTarget = target;
    gsap.to(target, { scale: .975, duration: .12, ease: 'power2.out', overwrite: 'auto' });
  }, { signal: motionListeners.signal });
  document.addEventListener('keyup', releaseTarget, { signal: motionListeners.signal });
  const visibility=()=>{if(document.hidden)lenis?.stop();else if(editor.hidden){lenis?.start();ScrollTrigger.refresh();}};
  document.addEventListener('visibilitychange',visibility);
  const blur=()=>lenis?.stop(),focus=()=>{if(editor.hidden)lenis?.start();};
  window.addEventListener('blur',blur);window.addEventListener('focus',focus);
  return()=>{reelMotion.revert();motionListeners.abort();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);gsap.ticker.remove(rafCallback);lenis?.off('scroll',ScrollTrigger.update);lenis?.destroy();lenis=undefined;};
});
document.fonts.ready.then(refreshLayout);
listen(window,'load',refreshLayout);
listen(window,'pagehide',()=>{motion.revert();progressTrigger?.kill();sectionTriggers.forEach(trigger=>trigger.kill());lifecycle.abort();clearTimeout(toastTimer);gsap.killTweensOf('#random-result');});
listen(window,'pageshow',event=>{if(event.persisted)location.reload();});
