export type WeChatArticle = {
  id: string;
  title: string;
  url?: string;
  excerpt?: string;
  cover?: string;
  publishedAt?: string;
  workId?: string;
  body?: string;
  archiveNote?: string;
  readerPath?: string;
};

export type WeChatCollection = {
  name: string;
  accountId?: string;
  homeUrl?: string;
  articles: WeChatArticle[];
  updatedAt?: string;
};

/** Only our generated, script-free local readers may be embedded. */
export function wechatReader(value: unknown): string {
  return typeof value === 'string' && /^content\/articles\/[a-z0-9][a-z0-9_-]{0,99}\/index\.html$/.test(value) ? value : '';
}

const privateParameters = ['token', 'appmsg_token', 'pass_ticket', 'key', 'uin', 'wxtoken', 'exportkey'];
const publicHomePaths = new Set(['/mp/profile_ext', '/mp/appmsgalbum', '/mp/homepage']);

/** Keep public WeChat links only; never publish copied account/session parameters. */
export function wechatLink(value: unknown, kind: 'article' | 'home' = 'article'): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096) return '';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'mp.weixin.qq.com' || url.username || url.password || url.port) return '';
    const article = /^\/s\/[^/]+\/?$/.test(url.pathname) || (url.pathname === '/s' && !!url.searchParams.get('__biz') && !!url.searchParams.get('mid'));
    if (!article && !(kind === 'home' && publicHomePaths.has(url.pathname) && !!url.searchParams.get('__biz'))) return '';
    privateParameters.forEach(parameter => url.searchParams.delete(parameter));
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

export function wechatCover(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096) return '';
  const clean = value.trim();
  if (/^https:/i.test(clean)) {
    try {
      const url = new URL(clean);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }
  // Relative assets work on GitHub Pages too. Protocol-relative URLs and traversal do not.
  if (/^[a-z][a-z\d+.-]*:/i.test(clean) || clean.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(clean)) return '';
  try {
    const decoded = decodeURIComponent(clean.split(/[?#]/)[0]);
    if (decoded.split('/').some(part => part === '..' || part === '.')) return '';
    return /^\/?[\w\u0080-\uffff][^<>]*\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(clean) ? clean : '';
  } catch { return ''; }
}

const text = (value: unknown, field: string, max: number, required = false) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('请检查公众号的' + field + '。');
  return value.trim();
};

export function validateWeChat(input: unknown): WeChatCollection {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('公众号资料需要是一个对象。');
  const source = input as Record<string, unknown>;
  if (!Array.isArray(source.articles) || source.articles.length > 1000) throw new Error('公众号文章需要是数组，最多 1000 篇。');
  const name = text(source.name, '名称', 100, source.articles.length > 0 || !!source.homeUrl || !!source.accountId);
  const result: WeChatCollection = { name, articles: [] };
  if (typeof source.updatedAt === 'string' && !Number.isNaN(Date.parse(source.updatedAt))) result.updatedAt = source.updatedAt;
  if (source.accountId !== undefined) {
    const id = text(source.accountId, '账号', 64);
    if (id && !/^gh_[a-z0-9]{3,60}$/i.test(id)) throw new Error('公众号原始 ID 请使用 gh_ 开头的账号。');
    if (id) result.accountId = id;
  }
  if (source.homeUrl !== undefined) {
    const raw = text(source.homeUrl, '主页链接', 4096);
    if (raw) {
      const link = wechatLink(raw, 'home');
      if (!link) throw new Error('公众号主页请使用 https://mp.weixin.qq.com 的公开主页或文章链接。');
      result.homeUrl = link;
    }
  }
  const ids = new Set<string>();
  const links = new Set<string>();
  result.articles = source.articles.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('有一篇公众号文章缺少内容。');
    const article = value as Record<string, unknown>;
    const id = text(article.id, '文章编号', 100, true);
    const title = text(article.title, '文章标题', 160, true);
    const rawLink = article.url === undefined ? '' : text(article.url, '原文链接', 4096);
    const link = wechatLink(rawLink);
    const body = article.body === undefined ? '' : text(article.body, '归档正文', 200000);
    const readerPath = wechatReader(article.readerPath);
    if (article.readerPath && !readerPath) throw new Error('文章阅读页路径无效。');
    if (rawLink && !link) throw new Error('「' + title + '」需要 https://mp.weixin.qq.com/s 开头的公开文章链接。');
    if (!link && !body && !readerPath) throw new Error('「' + title + '」请补充原文链接，或在 JSON 中保留已有的归档正文。');
    if (ids.has(id)) throw new Error('每篇公众号文章的 id 必须不同。');
    if (link && links.has(link)) throw new Error('同一篇公众号文章只需添加一次。');
    ids.add(id); if (link) links.add(link);
    const checked: WeChatArticle = { id, title };
    if (link) checked.url = link;
    if (body) checked.body = body;
    if (readerPath) checked.readerPath = readerPath;
    if (article.archiveNote !== undefined) checked.archiveNote = text(article.archiveNote, '归档说明', 600);
    if (article.excerpt !== undefined) checked.excerpt = text(article.excerpt, '文章摘要', 600);
    if (article.cover !== undefined) {
      const raw = text(article.cover, '文章封面', 4096);
      if (raw) {
        const cover = wechatCover(raw);
        if (!cover) throw new Error('「' + title + '」的封面请使用 HTTPS 图片链接或站内图片路径。');
        checked.cover = cover;
      }
    }
    if (article.publishedAt !== undefined) {
      const date = text(article.publishedAt, '发布日期', 10);
      if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new Error('发布日期请使用有效的 YYYY-MM-DD 日期。');
      if (date) checked.publishedAt = date;
    }
    if (article.workId !== undefined) {
      const workId = text(article.workId, '关联作品', 100);
      if (workId && !/^[a-z0-9][a-z0-9_-]*$/i.test(workId)) throw new Error('关联作品请使用作品的英文编号。');
      if (workId) checked.workId = workId;
    }
    return checked;
  });
  return result;
}
