import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchPublished, normalizePublished, mergePublished, plainText, syncWeChat, publicArticleUrl } from '../scripts/sync-wechat.mjs';
import { importPublished, mergePublicImport, validatePublishedImport, readerPath } from '../scripts/import-published.mjs';
import { validateWeChat } from '../src/wechat.ts';

const response = value => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
const news = (id = 'publication-one', url = 'https://mp.weixin.qq.com/s/first') => ({ article_id: id, update_time: 1793516400, content: { news_item: [{ title: '一个问题', digest: '从哪里开始', content: '<p>先看这个现象。</p><p>为什么？</p>', url }] } });
const previous = () => ({ name: 'yo7的堂吉诃德', accountId: 'gh_29c0b927a35c', articles: [{ id: 'writing-a06', title: '一个问题', url: 'https://mp.weixin.qq.com/s/first', body: '旧正文', publishedAt: '2026-10-28', readerPath: 'content/articles/writing-a06/index.html', thought: { question: '保留人工整理的问题' } }] });
const imported = () => ({ source: 'published-public', articles: [{ publicationStatus: 'published', id: 'new-one', title: '一个新问题', url: 'https://mp.weixin.qq.com/s/new', publishedAt: '2026-11-04', body: '先看观察，再看解释。' }] });

test('long articles accepted by either importer remain readable by the browser validator', () => {
  const body = '原文'.repeat(100000);
  const input = imported(); input.articles[0].body = body;
  const publicFeed = mergePublicImport(previous(), validatePublishedImport(input));
  assert.equal(validateWeChat(publicFeed).articles.find(article => article.id === 'new-one').body, body);
  const row = news(); row.content.news_item[0].content = `<p>${body}</p>`;
  const officialFeed = mergePublished(previous(), normalizePublished([row]));
  assert.equal(validateWeChat(officialFeed).articles[0].body, body);
  input.articles[0].body += 'x';
  assert.throws(() => validatePublishedImport(input));
  assert.throws(() => validateWeChat({...previous(), articles:[{...previous().articles[0], body:body+'x'}]}));
});

test('official fetch traverses every page and requests content with stable credentials', async () => {
  const calls = [];
  const rows = await fetchPublished({ appid: 'fixture-app', secret: 'fixture-secret', fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body); calls.push({ url, body });
    if (calls.length === 1) return response({ access_token: 'fixture-token', expires_in: 7200 });
    return response({ total_count: 2, item_count: 1, item: [news('publication-' + body.offset, 'https://mp.weixin.qq.com/s/item-' + body.offset)] });
  } });
  assert.equal(rows.length, 2);
  assert.equal(calls[0].body.force_refresh, false);
  assert.deepEqual(calls.slice(1).map(call => call.body), [{ offset: 0, count: 20, no_content: 0 }, { offset: 1, count: 20, no_content: 0 }]);
});

test('permission and IP failures never reveal the raw API message or token', async () => {
  for (const errcode of [48001, 40164]) {
    await assert.rejects(fetchPublished({ appid: 'fixture-app', secret: 'fixture-secret', fetchImpl: async () => response({ errcode, errmsg: 'fixture-secret credential-leak' }) }), error => error.code === String(errcode) && !error.message.includes('fixture-secret'));
  }
});

test('partial pagination leaves the existing public file byte-for-byte unchanged', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yo7-sync-'));
  try {
    const file = join(directory, 'wechat.json'); const original = JSON.stringify(previous()); await writeFile(file, original);
    let call = 0;
    await assert.rejects(syncWeChat({ file, appid: 'fixture', secret: 'fixture', fetchImpl: async () => ++call === 1 ? response({ access_token: 'fixture' }) : response({ total_count: 2, item_count: 0, item: [] }) }), /缺少分页/);
    assert.equal(await readFile(file, 'utf8'), original);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('normalization creates inert text, excludes deleted entries and does not invent a publication date', () => {
  const row = news(); row.content.news_item[0].content = '<script>private()</script><p>平方 &amp; 能量</p><img src="https://mmbiz.qpic.cn/x"><p>再看条件</p>';
  row.content.news_item.push({ title: 'deleted', url: 'https://mp.weixin.qq.com/s/deleted', is_deleted: true });
  const result = normalizePublished([row]);
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].body, '平方 & 能量\n\n再看条件');
  assert.equal(result.articles[0].publishedAt, undefined);
  assert.match(result.articles[0].archiveNote, /配图请看公众号原文/);
  assert.deepEqual(result.deletedUrls, ['https://mp.weixin.qq.com/s/deleted']);
  assert.equal(plainText('<p>&#x4f60;&#22909;</p>'), '你好');
});

test('official updates preserve stable IDs, actual publication dates and curated reader metadata', () => {
  const merged = mergePublished(previous(), normalizePublished([news()]));
  assert.equal(merged.articles.length, 1);
  assert.equal(merged.articles[0].id, 'writing-a06');
  assert.equal(merged.articles[0].publishedAt, '2026-10-28');
  assert.equal(merged.articles[0].readerPath, 'content/articles/writing-a06/index.html');
  assert.deepEqual(merged.articles[0].thought, previous().articles[0].thought);
  assert.match(merged.articles[0].body, /为什么/);
  assert.equal(previous().articles[0].body, '旧正文');
});

test('public import rejects drafts, session links, foreign URLs, invalid dates and path escapes', () => {
  for (const patch of [
    { publicationStatus: 'draft' }, { url: 'https://mp.weixin.qq.com/cgi-bin/home?token=private' },
    { url: 'https://mp.weixin.qq.com/s/new?token=private' }, { url: 'https://example.com/article' },
    { publishedAt: '2026-02-30' }, { readerPath: 'content/articles/../../private.html' },
    { readerPath: 'https://example.com/index.html' }, { id: '../secret' },
  ]) {
    const input = imported(); Object.assign(input.articles[0], patch);
    assert.throws(() => validatePublishedImport(input));
  }
  assert.equal(readerPath('content/articles/a/index.html'), 'content/articles/a/index.html');
  assert.equal(publicArticleUrl('https://mp.weixin.qq.com/s/new?tempkey=private'), '');
});

test('public import stores only allowed fields and deduplicates against the canonical URL', () => {
  const input = imported(); input.articles[0].url = previous().articles[0].url;
  input.articles[0].cookies = 'never publish'; input.articles[0].access_token = 'never publish';
  const clean = validatePublishedImport(input);
  assert.equal(clean[0].cookies, undefined); assert.equal(clean[0].access_token, undefined);
  const merged = mergePublicImport(previous(), clean);
  assert.equal(merged.articles.length, 1); assert.equal(merged.articles[0].id, 'writing-a06');
  assert.equal(merged.articles[0].readerPath, 'content/articles/writing-a06/index.html');
  assert.deepEqual(merged.articles[0].thought, previous().articles[0].thought);
  const collision = imported(); collision.articles[0].id = 'writing-a06';
  assert.throws(() => mergePublicImport(previous(), validatePublishedImport(collision)), /编号已用于/);
});

test('public import requires an existing static reader and unchanged imports do not rewrite the snapshot', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yo7-import-'));
  try {
    const file = join(directory, 'wechat.json'); await writeFile(file, JSON.stringify(previous()));
    const input = imported(); input.articles[0].readerPath = 'content/articles/new-one/index.html';
    await assert.rejects(importPublished({ input, file, publicRoot: directory }), /先生成/);
    await mkdir(join(directory, 'content/articles/new-one'), { recursive: true });
    await writeFile(join(directory, input.articles[0].readerPath), '<p>静态阅读页</p>');
    assert.equal((await importPublished({ input, file, publicRoot: directory })).changed, true);
    const first = await readFile(file, 'utf8');
    assert.equal((await importPublished({ input, file, publicRoot: directory })).changed, false);
    assert.equal(await readFile(file, 'utf8'), first);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
