import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { ThinkingDesk } from './ThinkingDesk';
import { wechatReader, wechatLink, type WeChatArticle, type WeChatCollection } from './wechat';
import './wechat.css';
import './reading-room.css';

export type OpenArticleRequest = { id: string; token: number };

export function WeChatShelf({collection,compact=false,reduced=false,openArticle}:{collection?:WeChatCollection;compact?:boolean;reduced?:boolean;openArticle?:OpenArticleRequest}) {
  const titleId=useId();
  const [selected,setSelected]=useState<WeChatArticle|null>(null);
  const [expanded,setExpanded]=useState(false),[query,setQuery]=useState('');
  const [notice,setNotice]=useState('');
  const consumed=useRef<number|null>(null);
  const articles=useMemo(()=>(collection?.articles||[]).filter(a=>wechatLink(a.url)||a.body||wechatReader(a.readerPath)),[collection]);
  const open=useCallback((id:string)=>{const article=articles.find(a=>a.id===id);if(article)setSelected(article);},[articles]);
  useEffect(()=>{
    if(!openArticle||consumed.current===openArticle.token)return;
    if(articles.some(a=>a.id===openArticle.id)){open(openArticle.id);consumed.current=openArticle.token;}
  },[openArticle,articles,open]);
  const found=articles.filter(a=>!query||`${a.title} ${a.body||''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const shown=expanded||query?found:found.slice(0,3);
  const copy=async()=>{try{await navigator.clipboard.writeText(collection?.accountId||collection?.name||'');setNotice('已复制');}catch{setNotice(collection?.accountId||'请在微信搜索公众号名称');}};
  return <section className={`wechat-shelf reading-room ${compact?'is-compact':''} ${reduced?'is-still':''}`} aria-labelledby={titleId}>
    <div className="reading-room-heading">
      <h3 id={titleId}>{collection?.name==='yo7的堂吉诃德'?<><span>yo7的</span>堂吉诃德</>:collection?.name||'笔记'}</h3>
      <button className="reading-account" onClick={copy} aria-label="复制公众号账号"><Icon name="copy-linear" size={16}/><span aria-live="polite">{notice||'公众号'}</span></button>
    </div>
    {compact&&<ThinkingDesk reduced={reduced} articles={articles} onRead={open}/>}
    <div className="writing-index">
      <div className="writing-index-head"><h4>{expanded?'全部文章':'最近写的'}<span>{articles.length}</span></h4><label className="writing-search"><Icon name="magnifier-linear" size={18}/><input aria-label="搜索文章" placeholder="找一篇" value={query} onChange={e=>{setQuery(e.target.value);setExpanded(true);}}/></label></div>
      <ul className="writing-rows">{shown.map(article=><li key={article.id}><button onClick={()=>open(article.id)} aria-label={`阅读：${article.title}`}><time dateTime={article.publishedAt}>{article.publishedAt?.replaceAll('-','.')||'新文章'}</time><span>{article.title}</span><Icon name="arrow-right-up-linear" size={23}/></button></li>)}</ul>
      {!found.length&&<p className="reading-empty">{query?'没找到，换个词试试。':'还没有文章。'}</p>}
      {articles.length>3&&!query&&<button className="writing-index-toggle" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?'收起目录':`全部 ${articles.length} 篇`}<Icon name={expanded?'arrow-up-linear':'arrow-down-linear'} size={18}/></button>}
    </div>
    {selected&&<ArticleReader article={selected} onClose={()=>setSelected(null)}/>}
  </section>;
}

function ArticleReader({article,onClose}:{article:WeChatArticle;onClose:()=>void}) {
  const path=wechatReader(article.readerPath),url=wechatLink(article.url);
  const [loaded,setLoaded]=useState(false);
  return <Modal title={article.title} onClose={onClose} wide className="article-reader">
    <div className="article-reader-meta"><time dateTime={article.publishedAt}>{article.publishedAt}</time>{url&&<a href={url} target="_blank" rel="noopener noreferrer">微信原文<Icon name="arrow-right-up-linear" size={16}/></a>}</div>
    {path?<div className="article-reader-page">{!loaded&&<span className="reader-loading" role="status">正在翻开…</span>}<iframe title={`${article.title}，完整图文`} src={import.meta.env.BASE_URL+path+'#read'} sandbox="" referrerPolicy="no-referrer" onLoad={()=>setLoaded(true)} data-lenis-prevent/></div>:article.body?<div className="article-text-fallback">{article.archiveNote&&<p className="article-source-note">{article.archiveNote}</p>}<ArchivedBody body={article.body}/></div>:<p className="article-text-fallback">请通过上方「微信原文」阅读。</p>}
  </Modal>;
}

function ArchivedBody({body}:{body:string}) {
  const fence=String.fromCharCode(96).repeat(3);
  return <div className="wechat-reading-body">{body.split(new RegExp(`(${fence}[^\\n]*\\n[\\s\\S]*?${fence})`,'g')).map((part,index)=>part.startsWith(fence)?<pre key={index}><code>{part.replace(/^\x60\x60\x60[^\n]*\n/,'').replace(/\x60\x60\x60$/,'')}</code></pre>:<p key={index}>{part}</p>)}</div>;
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
    <p className="wechat-editor-note">已归档的文章可以在站内读，也保留微信原文。这里的修改随个人资料保存。</p>
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
    <button className="button secondary wechat-add" type="button" disabled={collection.articles.length >= 1000} onClick={add}><Icon name="add-circle-linear" size={19} />添加文章</button>
    {collection.articles.length >= 1000 && <p className="wechat-editor-note">已到 1000 篇上限，请先整理现有文章。</p>}
  </fieldset>;
}
