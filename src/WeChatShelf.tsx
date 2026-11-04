import { useId, useState } from 'react';
import { Icon } from './Icon';
import { wechatCover, wechatLink, type WeChatArticle, type WeChatCollection } from './wechat';
import './wechat.css';

function ArticleCover({ article }: { article: WeChatArticle }) {
  const [failed, setFailed] = useState(false);
  const source = wechatCover(article.cover);
  if (!source || failed) return null;
  const url = source.startsWith('https:') ? source : import.meta.env.BASE_URL + source.replace(/^\//, '');
  return <span className="wechat-article-cover"><img src={url} alt="" width={160} height={120} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} /></span>;
}

export function WeChatShelf({ collection, compact = false }: { collection?: WeChatCollection; compact?: boolean }) {
  const titleId = useId();
  const [copyNotice, setCopyNotice] = useState('');
  const articles = (collection?.articles ?? []).filter(article => wechatLink(article.url) || article.body?.trim());
  const home = wechatLink(collection?.homeUrl, 'home');
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setCopyNotice(label + '已复制，在微信搜索中粘贴即可。'); }
    catch { setCopyNotice('可在微信中搜索：' + value); }
  };
  const articleSummary = (article: WeChatArticle, archive = false) => <>
    <div className="wechat-article-copy">
      <h4>{article.title}</h4>
      {article.excerpt && <p>{article.excerpt}</p>}
      <span className="wechat-article-meta">{article.publishedAt && <time dateTime={article.publishedAt}>{article.publishedAt.replaceAll('-', '.')}</time>}<span>{archive ? '展开阅读' : '微信原文'}</span></span>
    </div>
    <ArticleCover key={article.cover} article={article} />
      <span className="wechat-article-arrow" aria-hidden="true"><Icon name={archive ? 'arrow-down-linear' : 'arrow-right-up-linear'} size={23} /></span>
  </>;
  return <section className={['wechat-shelf', compact && 'is-compact'].filter(Boolean).join(' ')} aria-labelledby={titleId}>
    <div className="wechat-shelf-heading">
      <h3 id={titleId}>{collection?.name?.trim() || '文字的另一面'}</h3>
      {home && <a className="wechat-home" href={home} target="_blank" rel="noopener noreferrer">到公众号<Icon name="arrow-right-up-linear" size={18} /><span className="wechat-sr-only">，在新窗口打开</span></a>}
    </div>
    {collection?.accountId && <div className="wechat-account"><div><span>在微信搜索「{collection.name}」</span><span className="wechat-account-id">{collection.accountId}</span></div><div className="wechat-account-actions"><button type="button" onClick={() => copy(collection.name, '名称')}>复制名称</button><button type="button" onClick={() => copy(collection.accountId!, '账号')}>复制账号</button></div><p role="status" className="wechat-copy-notice">{copyNotice}</p></div>}
    {articles.length ? <ul className="wechat-articles">{articles.map(article => <li key={article.id}>
      {article.body ? <details className="wechat-archive" name={'wechat-archive-' + titleId}>
        <summary className="wechat-article">{articleSummary(article, true)}</summary>
        <div className="wechat-reading">
          <div className="wechat-reading-source"><p>{article.archiveNote || '本地归档正文'}</p>{wechatLink(article.url) ? <a href={wechatLink(article.url)} target="_blank" rel="noopener noreferrer">阅读微信原文<Icon name="arrow-right-up-linear" size={16}/></a> : <span>原文链接待补充</span>}</div>
          <ArchivedBody body={article.body} />
        </div>
      </details> : <a className="wechat-article" href={wechatLink(article.url)} target="_blank" rel="noopener noreferrer" aria-label={article.title + '，在新窗口打开微信原文'}>{articleSummary(article)}</a>}
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
