/** Import reviewed, already-published public articles. No authenticated browser data. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SyncError, publicArticleUrl, saveSnapshot } from './sync-wechat.mjs';

const FORBIDDEN_QUERY = /^(?:access_token|token|appmsg_token|pass_ticket|key|uin|wxtoken|exportkey|tempkey)$/i;
const MAX_INPUT_BYTES = 12 * 1024 * 1024;

export function readerPath(value) {
  if (typeof value !== 'string' || value.length > 300) return '';
  // Generated static readers belong to this one directory; no URL, traversal or escaping.
  return /^content\/articles\/[a-z0-9][a-z0-9_-]*\/index\.html$/i.test(value) ? value : '';
}

function publishedUrl(value) {
  const clean = publicArticleUrl(value);
  if (!clean) throw new SyncError('URL', '每篇文章必须有 https://mp.weixin.qq.com/s 的公开文章链接。');
  const url = new URL(value.replaceAll('&amp;', '&'));
  if ([...url.searchParams.keys()].some(key => FORBIDDEN_QUERY.test(key))) throw new SyncError('PRIVATE_URL', '不能导入含后台或会话参数的链接；请使用公开文章链接。');
  return clean;
}

function string(value, name, max, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new SyncError('FIELD', `请检查文章${name}。`);
  return value.trim();
}

export function validatePublishedImport(input) {
  if (!input || input.source !== 'published-public' || !Array.isArray(input.articles) || input.articles.length < 1 || input.articles.length > 5000) throw new SyncError('IMPORT', '导入文件需要 source: published-public 和非空 articles 数组。');
  const ids = new Set(), urls = new Set();
  return input.articles.map(value => {
    if (!value || typeof value !== 'object' || value.publicationStatus !== 'published') throw new SyncError('STATUS', '仅接受已核实发表的文章；草稿不能导入。');
    const url = publishedUrl(value.url);
    const id = value.id === undefined ? 'wx-' + createHash('sha256').update(url).digest('hex').slice(0, 20) : string(value.id, '编号', 100, true);
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) throw new SyncError('ID', '文章编号只接受字母、数字、下划线和连字符。');
    if (ids.has(id) || urls.has(url)) throw new SyncError('DUPLICATE', '导入文件包含重复文章编号或链接。');
    ids.add(id); urls.add(url);
    const article = { id, title: string(value.title, '标题', 160, true), url, source: 'published-public' };
    const date = string(value.publishedAt, '发布日期', 10, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new SyncError('DATE', '发布日期必须是有效的 YYYY-MM-DD。');
    article.publishedAt = date;
    for (const [key, label, max] of [['body', '正文', 200000], ['excerpt', '摘要', 600], ['archiveNote', '归档说明', 600]]) {
      const text = string(value[key], label, max);
      if (text !== undefined) article[key] = text;
    }
    if (value.readerPath !== undefined) {
      const path = readerPath(value.readerPath);
      if (!path) throw new SyncError('READER', '正文页面必须在 content/articles/<文章编号>/index.html。');
      article.readerPath = path;
    }
    if (value.cover !== undefined) {
      const cover = string(value.cover, '封面', 4096);
      const local = /^content\/articles\/[a-z0-9][a-z0-9_-]*\/images\/[a-z0-9][a-z0-9_.-]*\.(?:png|jpe?g|gif|webp|avif)$/i.test(cover);
      let remote = false;
      try { const parsed = new URL(cover); remote = parsed.protocol === 'https:' && ['mmbiz.qpic.cn', 'mmbiz.qlogo.cn'].includes(parsed.hostname) && !parsed.port && !parsed.username && !parsed.password && ![...parsed.searchParams.keys()].some(key => FORBIDDEN_QUERY.test(key)); } catch {}
      if (!local && !remote) throw new SyncError('COVER', '封面必须是归档内图片或微信公开图片地址。');
      article.cover = cover;
    }
    if (!article.body && !article.readerPath) throw new SyncError('CONTENT', '文章需要正文或已生成的本地阅读页。');
    return article;
  });
}

export function mergePublicImport(previous, incoming) {
  if (!previous || !Array.isArray(previous.articles)) throw new SyncError('SNAPSHOT', '现有文章归档格式不正确。');
  const articles = previous.articles.map(article => ({ ...article }));
  for (const item of incoming) {
    const sameId = articles.findIndex(article => article.id === item.id);
    const sameUrl = articles.findIndex(article => publicArticleUrl(article.url) === item.url);
    if (sameId >= 0 && publicArticleUrl(articles[sameId].url) && publicArticleUrl(articles[sameId].url) !== item.url) throw new SyncError('ID_COLLISION', '文章编号已用于另一篇原文，导入已停止。');
    const index = sameUrl >= 0 ? sameUrl : sameId;
    if (index < 0) articles.push(item);
    else articles[index] = { ...articles[index], ...item, id: articles[index].id };
  }
  articles.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return { ...previous, articles };
}

export async function importPublished({ input, file = resolve('public/content/wechat.json'), publicRoot = resolve('public') }) {
  const incoming = validatePublishedImport(input);
  for (const article of incoming) {
    if (!article.readerPath) continue;
    const absolute = resolve(publicRoot, article.readerPath);
    const fromRoot = relative(publicRoot, absolute);
    if (fromRoot.startsWith('..' + sep) || fromRoot === '..') throw new SyncError('READER', '阅读页超出 public 目录。');
    try { await access(absolute); }
    catch { throw new SyncError('READER_MISSING', '请先生成净化后的本地阅读页，再更新文章索引。'); }
  }
  let previous;
  try { previous = JSON.parse(await readFile(file, 'utf8')); }
  catch { throw new SyncError('SNAPSHOT', '请先建立文章归档；未覆盖现有文件。'); }
  const next = mergePublicImport(previous, incoming);
  return { changed: await saveSnapshot(file, next, previous), count: next.articles.length };
}

async function stdinJson() {
  let length = 0; const chunks = [];
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > MAX_INPUT_BYTES) throw new SyncError('SIZE', '导入文件超过 12 MB。');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const source = process.argv[2];
    if (!source) throw new SyncError('ARGUMENT', '用法：node scripts/import-published.mjs <公开文章.json|->');
    const raw = source === '-' ? await stdinJson() : await readFile(source, 'utf8');
    if (Buffer.byteLength(raw) > MAX_INPUT_BYTES) throw new SyncError('SIZE', '导入文件超过 12 MB。');
    let input; try { input = JSON.parse(raw); } catch { throw new SyncError('JSON', '导入文件不是有效 JSON。'); }
    const result = await importPublished({ input });
    console.log(result.changed ? `已合并已发表文章，共 ${result.count} 篇。` : '文章没有变化。');
    if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\n`, { flag: 'a' });
  } catch (error) {
    console.error(error instanceof SyncError ? `导入未完成 [${error.code}]：${error.message}` : '导入未完成，现有索引保持不变。');
    process.exitCode = 1;
  }
}
