import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mergePublishedWriting, choosePublishedSnapshot, readPublishedCache, rememberPublishedBaselines, PUBLISHED_CACHE_LIMIT } from '../src/published-writing.ts';
import { validateWeChat, wechatReader } from '../src/wechat.ts';
import { defaultWeChatCollection as bundled } from '../src/archived-writing.ts';
import { defaultWeChatCollection as legacy } from '../src/legacy-writing.ts';

const oldArticle = {id:'writing-a06',title:'波',body:'旧的完整正文',publishedAt:'2026-10-28'};
const liteArticle = {id:'writing-a06',title:'波',url:'https://mp.weixin.qq.com/s/waves',readerPath:'content/articles/writing-a06/index.html',publishedAt:'2026-10-28'};
const fullArticle = {...liteArticle,body:'现在的完整正文'};
const account = {name:'yo7的堂吉诃德',accountId:'gh_29c0b927a35c'};
const collection = (articles, updatedAt = '2026-11-04T10:00:00Z') => ({...account,articles,updatedAt});
const defaults = [oldArticle,liteArticle];

test('legacy six-article and lightweight bundled snapshots upgrade to the complete public feed', () => {
  const publicArticles = [fullArticle, {id:'new',title:'新篇',body:'新正文',publishedAt:'2026-11-04'}];
  for (const baseline of [oldArticle,liteArticle]) {
    const merged = mergePublishedWriting(collection([baseline]), collection(publicArticles), defaults);
    assert.equal(merged.articles.length, 2);
    assert.equal(merged.articles.find(article => article.id === 'writing-a06').body, '现在的完整正文');
    assert.equal(merged.articles.find(article => article.id === 'writing-a06').readerPath, liteArticle.readerPath);
  }
});

test('legacy manual edits and unrelated local articles survive public updates without mutating either source', () => {
  const edited = {...oldArticle,title:'我手动改的标题'};
  const custom = {id:'personal',title:'自己的记录',body:'仅本地内容'};
  const local = collection([edited,custom]); const before = JSON.stringify(local);
  const publicFeed = collection([fullArticle]); const publicBefore = JSON.stringify(publicFeed);
  const merged = mergePublishedWriting(local, publicFeed, defaults);
  assert.equal(merged.articles.find(article => article.id === 'writing-a06').title, edited.title);
  assert.ok(merged.articles.some(article => article.id === 'personal'));
  assert.equal(JSON.stringify(local),before); assert.equal(JSON.stringify(publicFeed),publicBefore);
});

test('explicit follow refreshes saved full exports while retaining local additions', () => {
  const local = collection([{...fullArticle,body:'之前导出的完整正文'},{id:'custom',title:'保留我',body:'自定义'}]);
  const merged = mergePublishedWriting(local, collection([fullArticle]), defaults, {followPublished:true});
  assert.equal(merged.articles.find(article => article.id === 'writing-a06').body, fullArticle.body);
  assert.equal(merged.articles.find(article => article.id === 'custom').body, '自定义');
});

test('previous full feed is a baseline, but a user edit of that feed is still protected in legacy mode', () => {
  const previous = {...fullArticle,body:'前一次同步的正文'};
  const options = {baselines:[previous]};
  assert.equal(mergePublishedWriting(collection([previous]),collection([fullArticle]),defaults,options).articles[0].body,fullArticle.body);
  const edited = {...previous,excerpt:'手动摘要'};
  assert.equal(mergePublishedWriting(collection([edited]),collection([fullArticle]),defaults,options).articles[0].excerpt,'手动摘要');
});

test('a recognized full export keeps receiving later revisions rather than turning into a false edit', () => {
  const old = {...fullArticle,body:'最初的导出正文'};
  const middle = {...fullArticle,body:'中间的公开修订'};
  const local = collection([old]);
  const retained = rememberPublishedBaselines(local,[old],[middle]);
  const nextRetained = rememberPublishedBaselines(local,retained,[fullArticle]);
  const finalFeed = collection([{...fullArticle,body:'第三次修订'}]);
  assert.equal(mergePublishedWriting(local,finalFeed,defaults,{baselines:nextRetained}).articles[0].body,'第三次修订');
});

test('the actual six-article profile migrates to all bundled 25 articles and their complete readers', async () => {
  const publicFeed = validateWeChat(JSON.parse(await readFile(new URL('../public/content/wechat.json',import.meta.url),'utf8')));
  assert.equal(legacy.articles.length,6); assert.ok(bundled.articles.length>=25);
  for (const source of [legacy,bundled]) {
    const result = mergePublishedWriting(source,publicFeed,[...legacy.articles,...bundled.articles]);
    assert.equal(result.articles.length,publicFeed.articles.length);
    assert.ok(bundled.articles.every(original=>result.articles.some(article=>article.id===original.id && article.body && article.readerPath)));
    assert.equal(new Set(result.articles.map(article=>article.id)).size,result.articles.length);
  }
});

test('another account is never merged, and a custom homepage survives same-account updates', () => {
  const other = {...collection([oldArticle]),accountId:'gh_another123'};
  assert.equal(mergePublishedWriting(other,collection([fullArticle]),defaults,{followPublished:true}),other);
  const local = {...collection([liteArticle]),homeUrl:'https://mp.weixin.qq.com/s/my-home'};
  assert.equal(mergePublishedWriting(local,collection([fullArticle]),defaults).homeUrl,local.homeUrl);
});

test('empty, older, cross-account and invalid caches retain the bundled offline archive', () => {
  const bundled = collection([liteArticle]);
  const empty = collection([],'2026-11-05T10:00:00Z');
  const older = collection([oldArticle],'2026-10-30T10:00:00Z');
  const different = {...collection([fullArticle]),accountId:'gh_other123'};
  for (const next of [empty,older,different]) assert.equal(choosePublishedSnapshot(bundled,next),bundled);
  for (const raw of [null,'{broken',JSON.stringify(empty),JSON.stringify(older),JSON.stringify(different),' '.repeat(PUBLISHED_CACHE_LIMIT+1)]) assert.equal(readPublishedCache(raw,bundled,validateWeChat),bundled);
  const newer = collection([fullArticle],'2026-11-05T10:00:00Z');
  assert.deepEqual(readPublishedCache(JSON.stringify(newer),bundled,validateWeChat),newer);
});

test('reader paths accept only generated same-site article documents', () => {
  const safe = 'content/articles/writing-a06/index.html';
  assert.equal(wechatReader(safe),safe);
  const invalid = ['https://example.com/index.html','//example.com/index.html','content/articles/../index.html','content/articles/%2e%2e/index.html','content/articles/a/index.html?script=1','content/articles/a/index.html#x','content\\articles\\a\\index.html','data:text/html,<script>x</script>'];
  for (const value of invalid) {
    assert.equal(wechatReader(value),'');
    assert.throws(() => validateWeChat(collection([{...liteArticle,readerPath:value}])));
  }
  assert.equal(validateWeChat(collection([liteArticle])).articles[0].readerPath,safe);
});
