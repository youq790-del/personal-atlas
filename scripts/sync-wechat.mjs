/** Read published articles on the server; never import this module into the browser. */
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const API_ORIGIN = 'https://api.weixin.qq.com';
const MAX_ARTICLES = 5000;
const MAX_BYTES = 12 * 1024 * 1024;
const PRIVATE_QUERY = /^(?:access_token|token|appmsg_token|pass_ticket|key|uin|wxtoken|exportkey|tempkey)$/i;
const ERROR_MESSAGES = {
  40013: 'AppID 无效。', 40125: 'AppSecret 无效。',
  40164: '运行服务器的出口 IP 不在公众号白名单中。',
  48001: '账号没有已发布文章接口权限；个人主体账号不能以提供密钥代替该权限。',
  45009: '公众号接口今日额度已用完。', 45011: '公众号接口调用过于频繁。',
  89503: '此次接口调用需要公众号管理员在官方平台确认。',
};

export class SyncError extends Error {
  constructor(code, message) { super(message); this.name = 'SyncError'; this.code = String(code); }
}

export function publicArticleUrl(value) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  try {
    const url = new URL(value.replaceAll('&amp;', '&'));
    if (url.protocol !== 'https:' || url.hostname !== 'mp.weixin.qq.com' || url.port || url.username || url.password) return '';
    if (url.searchParams.has('tempkey')) return '';
    if (!/^\/s\/[^/]+\/?$/.test(url.pathname) && !(url.pathname === '/s' && url.searchParams.has('__biz') && url.searchParams.has('mid'))) return '';
    for (const key of [...url.searchParams.keys()]) if (PRIVATE_QUERY.test(key)) url.searchParams.delete(key);
    url.hash = '';
    return url.href;
  } catch { return ''; }
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ', ndash: '–', mdash: '—', hellip: '…' };
function decodeEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
    if (code[0] !== '#') return entities[code.toLowerCase()] ?? whole;
    const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : '';
  });
}

/** Stored as plain text, never as executable HTML or dangerouslySetInnerHTML. */
export function plainText(html) {
  if (typeof html !== 'string') return '';
  return decodeEntities(html
    .replace(/<(script|style|iframe|object|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|section|div|h[1-6]|li|blockquote|pre|tr)>/gi, '\n\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
}

function safeCover(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !['mmbiz.qpic.cn', 'mmbiz.qlogo.cn'].includes(url.hostname)) return '';
    if ([...url.searchParams.keys()].some(key => PRIVATE_QUERY.test(key))) return '';
    return url.href;
  } catch { return ''; }
}

async function readJson(response) {
  if (!response.ok) throw new SyncError('HTTP', `公众号接口返回 HTTP ${response.status}，原有内容保持不变。`);
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new SyncError('SIZE', '接口响应超过大小限制。');
  const reader = response.body?.getReader();
  if (!reader) throw new SyncError('EMPTY', '接口没有返回内容。');
  const chunks = []; let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) { await reader.cancel(); throw new SyncError('SIZE', '接口响应超过大小限制。'); }
    chunks.push(value);
  }
  let json;
  try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new SyncError('JSON', '接口没有返回有效 JSON。'); }
  if (json.errcode) throw new SyncError(json.errcode, ERROR_MESSAGES[json.errcode] || `公众号接口错误 ${Number(json.errcode) || 'unknown'}，原有内容保持不变。`);
  return json;
}

async function request(fetchImpl, path, data) {
  let response;
  try {
    response = await fetchImpl(API_ORIGIN + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data), redirect: 'error', signal: AbortSignal.timeout(30000) });
  } catch { throw new SyncError('NETWORK', '公众号接口连接失败或超时，原有内容保持不变。'); }
  return readJson(response);
}

export async function fetchPublished({ appid, secret, fetchImpl = fetch }) {
  if (!appid || !secret) throw new SyncError('CONFIG', '请在运行环境配置 WECHAT_APPID 和 WECHAT_APPSECRET；不要放入网页或源码。');
  const token = await request(fetchImpl, '/cgi-bin/stable_token', { grant_type: 'client_credential', appid, secret, force_refresh: false });
  if (typeof token.access_token !== 'string' || !token.access_token) throw new SyncError('TOKEN', '未取得有效的公众号接口凭据。');
  const rows = []; const ids = new Set(); let offset = 0;
  // A complete traversal is required before the caller is allowed to replace its snapshot.
  for (let page = 0; page < 250; page++) {
    const result = await request(fetchImpl, '/cgi-bin/freepublish/batchget?access_token=' + encodeURIComponent(token.access_token), { offset, count: 20, no_content: 0 });
    if (!Number.isInteger(result.total_count) || result.total_count < 0 || result.total_count > MAX_ARTICLES || !Array.isArray(result.item) || result.item_count !== result.item.length) throw new SyncError('SHAPE', '已发布列表结构异常，未替换原有内容。');
    if (offset < result.total_count && result.item.length === 0) throw new SyncError('PARTIAL', '已发布列表缺少分页数据，未替换原有内容。');
    for (const item of result.item) {
      if (typeof item.article_id !== 'string' || !item.article_id || !Array.isArray(item.content?.news_item)) throw new SyncError('SHAPE', '已发布文章结构异常，未替换原有内容。');
      if (ids.has(item.article_id)) throw new SyncError('UNSTABLE', '已发布列表在翻页期间发生变化，请下次重试。');
      ids.add(item.article_id); rows.push(item);
    }
    offset += result.item.length;
    if (offset >= result.total_count) return rows;
  }
  throw new SyncError('LIMIT', '文章分页超出处理上限，未替换原有内容。');
}

export function normalizePublished(rows) {
  const articles = []; const deletedUrls = [];
  for (const row of rows) {
    row.content.news_item.forEach((news, index) => {
      const url = publicArticleUrl(news.url);
      if (news.is_deleted) { if (url) deletedUrls.push(url); return; }
      const title = plainText(news.title).slice(0, 160);
      const body = plainText(news.content);
      if (!title || (!body && !url) || body.length > 200000) throw new SyncError('ARTICLE', '有一篇文章缺少标题、正文或公开链接，未替换原有内容。');
      const id = 'wx-' + createHash('sha256').update(row.article_id + ':' + index).digest('hex').slice(0, 20);
      const article = { id, title, source: 'wechat-official' };
      if (url) article.url = url;
      if (body) article.body = body;
      const excerpt = plainText(news.digest).slice(0, 600);
      if (excerpt) article.excerpt = excerpt;
      const cover = safeCover(news.thumb_url);
      if (cover) article.cover = cover;
      if (Number.isFinite(row.update_time) && row.update_time > 0) article.updatedAt = new Date(row.update_time * 1000).toISOString();
      // update_time is not the publication date; never manufacture publishedAt from it.
      if (/<img\b/i.test(news.content || '')) article.archiveNote = '文字已同步，配图请看公众号原文。';
      articles.push(article);
    });
  }
  return { articles, deletedUrls };
}

export function mergePublished(existing, incoming) {
  if (!existing || typeof existing !== 'object' || !Array.isArray(existing.articles)) throw new SyncError('SNAPSHOT', '现有文章文件格式不正确，未替换文件。');
  const next = existing.articles.map(article => ({ ...article }));
  const removed = new Set(incoming.deletedUrls);
  for (const article of incoming.articles) {
    const index = next.findIndex(old => old.id === article.id || (article.url && publicArticleUrl(old.url) === article.url));
    if (index < 0) { next.unshift(article); continue; }
    const old = next[index];
    // Keep permanent IDs, curation, illustrations, and the known publication date.
    // Updating the body does not invent a new interpretation of the author's argument.
    next[index] = { ...old, ...article, id: old.id, ...(old.cover && !article.cover ? { cover: old.cover } : {}) };
  }
  const uniqueIds = new Set(); const uniqueUrls = new Set();
  const articles = next.filter(article => {
    const url = publicArticleUrl(article.url);
    if (url && removed.has(url)) return false;
    if (uniqueIds.has(article.id) || (url && uniqueUrls.has(url))) return false;
    uniqueIds.add(article.id); if (url) uniqueUrls.add(url);
    return true;
  });
  articles.sort((a, b) => (b.publishedAt || b.updatedAt || '').localeCompare(a.publishedAt || a.updatedAt || ''));
  return { ...existing, articles };
}

export async function saveSnapshot(path, next, previous) {
  if (JSON.stringify(next) === JSON.stringify(previous)) return false;
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify({ ...next, schemaVersion: 1, updatedAt: new Date().toISOString() }, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
  return true;
}

export async function syncWeChat({ file = resolve('public/content/wechat.json'), appid, secret, fetchImpl = fetch } = {}) {
  let previous;
  try { previous = JSON.parse(await readFile(file, 'utf8')); }
  catch { throw new SyncError('SNAPSHOT', '请先建立 public/content/wechat.json 文章归档，原有文件未修改。'); }
  const rows = await fetchPublished({ appid, secret, fetchImpl });
  const next = mergePublished(previous, normalizePublished(rows));
  return { changed: await saveSnapshot(file, next, previous), count: next.articles.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await syncWeChat({ appid: process.env.WECHAT_APPID, secret: process.env.WECHAT_APPSECRET });
    console.log(result.changed ? `已更新文章归档，共 ${result.count} 篇。` : '文章没有变化。');
    if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\n`, { flag: 'a' });
  } catch (error) {
    // Do not log fetch URLs, raw API responses, stack traces, tokens, or secrets.
    console.error(error instanceof SyncError ? `同步未完成 [${error.code}]：${error.message}` : '同步未完成，原有内容保持不变。请检查运行环境。');
    process.exitCode = 1;
  }
}
