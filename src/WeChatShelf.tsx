import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { wechatCover, wechatLink, type WeChatArticle, type WeChatCollection } from './wechat';
import './wechat.css';

gsap.registerPlugin(useGSAP);

const folioContours = [
  'M38 92C112 8 280 20 403 19C530 18 589 83 577 202C564 337 465 422 318 421C157 419 53 375 27 276C10 210 6 131 38 92Z',
  'M63 32C200 54 355 2 527 28C569 35 590 82 575 138L544 382C407 361 240 438 68 407C22 399 12 360 26 302L44 80Z',
  'M25 109C114 15 336 41 495 22C568 13 594 58 577 120L549 364C387 381 229 434 76 404C22 393 10 343 24 290Z',
  'M54 58C209 10 341 57 502 27C552 18 587 44 576 105L548 375C429 421 228 388 70 414C27 421 10 382 23 322L38 110Z',
];

function FolioSkin({ index, wave }: { index: number; wave: boolean }) {
  return <span className="wechat-folio-skin" aria-hidden="true">
    <svg className="wechat-folio-shape" viewBox="0 0 600 440" preserveAspectRatio="none"><path d={folioContours[index % folioContours.length]} /></svg>
    {wave && <svg className="wechat-wave-lines" viewBox="0 0 600 440" preserveAspectRatio="none">{Array.from({ length: 5 }, (_, line) => <path key={line} d={Array.from({ length: 81 }, (_, point) => {
      const x = point * 7.5;
      const y = 220 + Math.sin(x / 64 + line * .32) * (45 + line * 15);
      return `${point ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ')} />)}</svg>}
  </span>;
}

function ArticleCover({ article }: { article: WeChatArticle }) {
  const [failed, setFailed] = useState(false);
  const source = wechatCover(article.cover);
  if (!source || failed) return null;
  const url = source.startsWith('https:') ? source : import.meta.env.BASE_URL + source.replace(/^\//, '');
  return <span className="wechat-article-cover"><img src={url} alt="" width={160} height={120} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} /></span>;
}

export type OpenArticleRequest = { id: string; token: number };

export function WeChatShelf({ collection, compact = false, reduced = false, openArticle }: { collection?: WeChatCollection; compact?: boolean; reduced?: boolean; openArticle?: OpenArticleRequest }) {
  const titleId = useId();
  const shelf = useRef<HTMLElement>(null);
  const [copyNotice, setCopyNotice] = useState('');
  const [readingNotice, setReadingNotice] = useState('');
  const articles = useMemo(() => (collection?.articles ?? []).filter(article => wechatLink(article.url) || article.body?.trim()), [collection]);
  const archives = useMemo(() => articles.filter(article => article.body?.trim()), [articles]);
  const nextArticleIndex = useRef(0);
  const focusFrame = useRef<number | null>(null);
  const consumedRequestToken = useRef<number | null>(null);
  const home = wechatLink(collection?.homeUrl, 'home');
  const name = collection?.name?.trim() || '文字的另一面';
  const isYo7 = name === 'yo7的堂吉诃德';

  const focusSummary = useCallback((details: HTMLDetailsElement) => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      const summary = details.querySelector<HTMLElement>('summary');
      if (!summary?.isConnected) return;
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }, []);

  const revealArticle = useCallback((id: string) => {
    const details = Array.from(shelf.current?.querySelectorAll<HTMLDetailsElement>('.wechat-archive') ?? []).find(item => item.dataset.articleId === id);
    const index = archives.findIndex(article => article.id === id);
    if (!details || index < 0) return false;
    details.open = true;
    nextArticleIndex.current = (index + 1) % archives.length;
    setReadingNotice('翻到《' + archives[index].title + '》');
    focusSummary(details);
    return true;
  }, [archives, focusSummary]);

  useEffect(() => {
    if (!openArticle || consumedRequestToken.current === openArticle.token) return;
    // A later collection update may supply a missing article; only consume successful requests.
    if (revealArticle(openArticle.id)) consumedRequestToken.current = openArticle.token;
  }, [openArticle?.id, openArticle?.token, revealArticle]);

  useEffect(() => () => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
  }, []);

  const turnPage = () => {
    if (archives.length) revealArticle(archives[nextArticleIndex.current % archives.length].id);
  };

  const closePage = (button: HTMLButtonElement) => {
    const details = button.closest('details');
    if (!details) return;
    details.open = false;
    setReadingNotice('这页已合上。');
    focusSummary(details);
  };

  useGSAP(() => {
    const root = shelf.current;
    if (!root || reduced) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-folio]')).map(element => ({
      element,
      skin: element.querySelector<HTMLElement>('.wechat-folio-skin')!,
      title: element.querySelector<HTMLElement>('h4')!,
      visible: false, x: 0, y: 0, stretch: 0, vx: 0, vy: 0, vs: 0, tx: 0, ty: 0,
    }));
    let ticking = false;
    const stop = () => { gsap.ticker.remove(tick); ticking = false; };
    const reset = () => {
      stop();
      items.forEach(item => {
        item.x = item.y = item.stretch = item.vx = item.vy = item.vs = item.tx = item.ty = 0;
        item.skin.style.removeProperty('transform');
        item.title.style.removeProperty('transform');
      });
    };
    const tick = () => {
      if (document.hidden || motion.matches) { reset(); return; }
      let active = false;
      const dt = Math.min(gsap.ticker.deltaRatio(), 2);
      items.forEach(item => {
        if (!item.visible || item.element.closest('details')?.open) {
          item.skin.style.removeProperty('transform'); item.title.style.removeProperty('transform');
          item.x = item.y = item.stretch = item.vx = item.vy = item.vs = item.tx = item.ty = 0;
          return;
        }
        item.vx = (item.vx + (item.tx - item.x) * .09 * dt) * Math.pow(.74, dt);
        item.vy = (item.vy + (item.ty - item.y) * .09 * dt) * Math.pow(.74, dt);
        item.vs = (item.vs - item.stretch * .07 * dt) * Math.pow(.78, dt);
        item.x += item.vx * dt; item.y += item.vy * dt;
        item.stretch = gsap.utils.clamp(-.065, .065, item.stretch + item.vs * dt);
        item.skin.style.transform = `translate3d(${item.x}px,${item.y}px,0) rotate(${item.x * .065}deg) skewY(${item.stretch * 30}deg) scale(${1 + item.stretch},${1 - item.stretch * .7})`;
        item.title.style.transform = `translate3d(${item.x * .16}px,${item.y * .16}px,0)`;
        active ||= Math.abs(item.tx - item.x) + Math.abs(item.ty - item.y) + Math.abs(item.vx) + Math.abs(item.vy) + Math.abs(item.stretch * 100) + Math.abs(item.vs * 100) > .025;
      });
      if (!active) stop();
    };
    const wake = () => { if (!ticking && !document.hidden && !motion.matches) { ticking = true; gsap.ticker.add(tick); } };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { const item = items.find(candidate => candidate.element === entry.target); if (item) item.visible = entry.isIntersecting; });
      if (!items.some(item => item.visible)) reset();
    }, { threshold: .05 });
    items.forEach(item => observer.observe(item.element));
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || motion.matches) return;
      const target = (event.target as Element).closest('[data-folio]');
      items.forEach(item => {
        if (item.element === target && !item.element.closest('details')?.open) {
          const bounds = item.element.getBoundingClientRect();
          item.tx = ((event.clientX - bounds.left) / bounds.width - .5) * 26;
          item.ty = ((event.clientY - bounds.top) / bounds.height - .5) * 18;
        } else { item.tx = item.ty = 0; }
      });
      wake();
    };
    const release = () => { items.forEach(item => { item.tx = item.ty = 0; }); wake(); };
    const touch = (event: PointerEvent) => {
      const target = (event.target as Element).closest('[data-folio]');
      const item = items.find(candidate => candidate.element === target);
      if (item) { item.vs -= .018; wake(); }
    };
    const scrollPositions = new WeakMap<EventTarget, number>();
    const scroll = (event: Event) => {
      const target = event.target || document;
      const position = target === document ? window.scrollY : (target as HTMLElement).scrollTop;
      const previous = scrollPositions.get(target) ?? position;
      scrollPositions.set(target, position);
      const impulse = gsap.utils.clamp(-40, 40, position - previous) * .0007;
      if (!impulse) return;
      items.forEach((item, index) => { if (item.visible) item.vs += impulse * (index % 2 ? -.8 : 1); });
      wake();
    };
    const visibility = () => { if (document.hidden) reset(); };
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerdown', touch, { passive: true });
    root.addEventListener('pointerleave', release);
    window.addEventListener('scroll', scroll, { capture: true, passive: true });
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', reset);
    return () => {
      observer.disconnect(); reset();
      root.removeEventListener('pointermove', move); root.removeEventListener('pointerdown', touch); root.removeEventListener('pointerleave', release);
      window.removeEventListener('scroll', scroll, true); document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', reset);
    };
  }, { scope: shelf, dependencies: [collection, reduced], revertOnUpdate: true });

  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setCopyNotice(label + '已复制，在微信搜索中粘贴即可。'); }
    catch { setCopyNotice('可在微信中搜索：' + value); }
  };
  const articleSummary = (article: WeChatArticle, index: number, archive = false) => <>
    <FolioSkin index={index} wave={index === 0} />
    <div className="wechat-article-copy">
      <span className="wechat-article-meta">{article.publishedAt && <time dateTime={article.publishedAt}>{article.publishedAt.replaceAll('-', '.')}</time>}</span>
      <h4>{article.title}</h4>
      {article.excerpt && <p>{article.excerpt}</p>}
      <span className="wechat-read-label">{archive ? <><span className="wechat-label-closed">展开阅读</span><span className="wechat-label-open">收起文章</span></> : '微信原文'}</span>
    </div>
    <ArticleCover key={article.cover} article={article} />
      <span className="wechat-article-arrow" aria-hidden="true"><Icon name={archive ? 'arrow-down-linear' : 'arrow-right-up-linear'} size={23} /></span>
  </>;
  return <section ref={shelf} className={['wechat-shelf', compact && 'is-compact', reduced && 'is-still'].filter(Boolean).join(' ')} aria-labelledby={titleId}>
    <div className="wechat-shelf-heading">
      <h3 id={titleId} className={isYo7 ? 'wechat-masthead' : ''} aria-label={name}>{isYo7 ? <><span className="wechat-masthead-sign" aria-hidden="true">yo7<span>的</span></span><span className="wechat-masthead-title" aria-hidden="true">堂吉诃德<span className="wechat-masthead-dot">。</span></span></> : name}</h3>
      {home && <a className="wechat-home" href={home} target="_blank" rel="noopener noreferrer">到公众号<Icon name="arrow-right-up-linear" size={18} /><span className="wechat-sr-only">，在新窗口打开</span></a>}
    </div>
    {compact && <div className="wechat-invitation"><p>把没想明白的事，先写下来。</p>{archives.length > 0 && <div className="wechat-turn-controls"><button type="button" className="wechat-turn-page" onClick={turnPage}>随手翻一篇<Icon name="arrow-right-up-linear" size={20}/></button><span className="wechat-reading-notice" role="status" aria-live="polite" aria-atomic="true">{readingNotice}</span></div>}</div>}
    {collection?.accountId && <div className="wechat-account"><div><span>微信公众号</span><span className="wechat-account-id">{collection.accountId}</span></div><div className="wechat-account-actions"><button type="button" onClick={() => copy(collection.name, '名称')}>复制名称<Icon name="arrow-right-up-linear" size={15}/></button><button type="button" onClick={() => copy(collection.accountId!, '账号')}>复制账号<Icon name="arrow-right-up-linear" size={15}/></button></div><p role="status" className="wechat-copy-notice">{copyNotice}</p></div>}
    {articles.length ? <ul className="wechat-articles">{articles.map((article, index) => <li key={article.id} className={`wechat-folio folio-${index % 6}${article.title.length <= 2 ? ' folio-short-title' : ''}`}>
      {article.body ? <details className="wechat-archive" data-article-id={article.id} name={'wechat-archive-' + titleId} onToggle={event => {
        if (event.currentTarget.open) {
          const index = archives.findIndex(item => item.id === article.id);
          if (index >= 0) nextArticleIndex.current = (index + 1) % archives.length;
        }
      }}>
        <summary className="wechat-article" data-folio>{articleSummary(article, index, true)}</summary>
        <div className="wechat-reading">
          <div className="wechat-reading-source"><p>{article.archiveNote || '本地归档正文'}</p>{wechatLink(article.url) ? <a href={wechatLink(article.url)} target="_blank" rel="noopener noreferrer">阅读微信原文<Icon name="arrow-right-up-linear" size={16}/></a> : <span>原文链接待补充</span>}</div>
          <ArchivedBody body={article.body} />
          <div className="wechat-reading-end"><button type="button" className="wechat-close-page" onClick={event => closePage(event.currentTarget)}>合上这页<Icon name="arrow-up-linear" size={19}/></button></div>
        </div>
      </details> : <a className="wechat-article" data-folio href={wechatLink(article.url)} target="_blank" rel="noopener noreferrer" aria-label={article.title + '，在新窗口打开微信原文'}>{articleSummary(article, index)}</a>}
    </li>)}</ul> : <div className="wechat-empty"><Icon name="document-text-linear" size={32} /><p>文章正在整理。<br />写下的思考，也会在这里相遇。</p></div>}
  </section>;
}

/** Render the supplied archive as text, never execute article HTML or code. */
function ArchivedBody({ body }: { body: string }) {
  // A small text renderer keeps code examples readable without a markdown dependency.
  const fence = String.fromCharCode(96).repeat(3);
  const parts = body.split(new RegExp(`(${fence}[^\n]*\n[\s\S]*?${fence})`, 'g'));
  return <div className="wechat-reading-body">{parts.map((part, partIndex) => {
    if (part.startsWith(String.fromCharCode(96).repeat(3))) {
      const content = part.replace(/^\x60\x60\x60[^\n]*\n/, '').replace(/\x60\x60\x60$/, '');
      return <pre key={partIndex}><code>{content}</code></pre>;
    }
    return part.trim().split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => {
      const key = partIndex + '-' + index;
      if (/^\[原文图片[^\]]+\]$/.test(paragraph)) return <p className="wechat-missing-figure" key={key}>{paragraph.replace(/[\[\]]/g, '').replace('；未转写图片内容', ' · 配图未收录')}</p>;
      if (/^(?:#{1,6}\s|[一二三四五六七八九十]+[。．、])/.test(paragraph) && paragraph.length < 100) return <h5 key={key}>{paragraph.replace(/^#{1,6}\s+/, '')}</h5>;
      return <p key={key}>{paragraph}</p>;
    });
  })}</div>;
}

const workOptions = [
  ['particles', '粒子标志'], ['grass', '动漫草地'], ['pop', '波普实验'],
  ['liquid', '液态玻璃'], ['cloud', '云'], ['organic', '有机方块'],
];

export function WeChatEditor({ value, onChange }: { value?: WeChatCollection; onChange: (value: WeChatCollection) => void }) {
  const collection = value ?? { name: '', articles: [] };
  const patch = (change: Partial<WeChatCollection>) => onChange({ ...collection, ...change });
  const patchArticle = (id: string, change: Partial<WeChatArticle>) => patch({ articles: collection.articles.map(article => article.id === id ? { ...article, ...change } : article) });
  const add = () => patch({ articles: [...collection.articles, { id: 'article-' + crypto.randomUUID(), title: '', url: '' }] });
  return <fieldset className="wechat-editor">
    <legend>微信公众号</legend>
    <p className="wechat-editor-note">收集公开原文链接；文章在微信中阅读。这里的修改随个人资料一起保存。</p>
    <div className="form-pair">
      <label>公众号名称<input maxLength={100} value={collection.name} placeholder="例如：我的公众号" required={collection.articles.length > 0 || !!collection.homeUrl} onChange={event => patch({ name: event.target.value })} /></label>
      <label>公众号主页 / 代表文章链接<input type="url" inputMode="url" maxLength={4096} value={collection.homeUrl ?? ''} placeholder="https://mp.weixin.qq.com/…" onChange={event => patch({ homeUrl: event.target.value })} /></label>
    </div>
    <label>公众号原始 ID（选填）<input maxLength={64} value={collection.accountId ?? ''} placeholder="gh_…" onChange={event => patch({ accountId: event.target.value })} /></label>
    <div className="wechat-editor-articles">{collection.articles.map((article, index) => <fieldset className="wechat-editor-article" key={article.id}>
      <legend>{article.title.trim() || '新文章 ' + (index + 1)}</legend>
      <div className="form-pair">
        <label>文章标题<input required maxLength={160} value={article.title} onChange={event => patchArticle(article.id, { title: event.target.value })} /></label>
        <label>原文链接{article.body ? '（可补充）' : ''}<input required={!article.body} type="url" inputMode="url" maxLength={4096} value={article.url ?? ''} placeholder="https://mp.weixin.qq.com/s/…" onChange={event => patchArticle(article.id, { url: event.target.value })} /></label>
      </div>
      <label>一句摘要（选填）<textarea rows={2} maxLength={600} value={article.excerpt ?? ''} onChange={event => patchArticle(article.id, { excerpt: event.target.value })} /></label>
      {article.body && <p className="wechat-editor-note">已包含本地归档正文。补充链接后，访客也可以阅读微信原文。</p>}
      <details className="wechat-editor-options"><summary>封面、日期与关联作品</summary>
        <label>封面图片（选填）<input maxLength={4096} value={article.cover ?? ''} placeholder="https://… 或 assets/works/…/poster.webp" onChange={event => patchArticle(article.id, { cover: event.target.value })} /></label>
        <div className="form-pair">
          <label>发布日期（选填）<input type="date" value={article.publishedAt ?? ''} onChange={event => patchArticle(article.id, { publishedAt: event.target.value })} /></label>
          <label>关联作品（选填）<select value={article.workId ?? ''} onChange={event => patchArticle(article.id, { workId: event.target.value })}><option value="">独立文章</option>{workOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}{article.workId && !workOptions.some(([id]) => id === article.workId) && <option value={article.workId}>{article.workId}</option>}</select></label>
        </div>
      </details>
      <button className="text-link wechat-remove" type="button" onClick={() => patch({ articles: collection.articles.filter(item => item.id !== article.id) })} aria-label={'移除文章：' + (article.title || '未命名文章')}>移除文章</button>
    </fieldset>)}</div>
    <button className="button secondary wechat-add" type="button" disabled={collection.articles.length >= 40} onClick={add}><Icon name="add-circle-linear" size={19} />添加文章</button>
    {collection.articles.length >= 40 && <p className="wechat-editor-note">已收集 40 篇文章，可通过 JSON 整理现有内容。</p>}
  </fieldset>;
}
