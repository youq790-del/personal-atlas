import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWeChat, wechatLink, wechatCover } from '../src/wechat.ts';

const collection = () => ({name:'我的公众号',articles:[{id:'article-one',title:'一篇真实文章',url:'https://mp.weixin.qq.com/s/example',publishedAt:'2026-10-28',workId:'grass'}]});
const archive = () => ({name:'yo7的堂吉诃德',accountId:'gh_29c0b927a35c',articles:[{id:'writing-a01',title:'反方向的钟',body:'第一段原文'}]});

test('public articles survive validation without changing their order or linked work', () => {
  const source = collection();
  source.articles.push({id:'article-two',title:'第二篇',url:'https://mp.weixin.qq.com/s/second',publishedAt:'2026-10-29',workId:'liquid'});
  const saved = validateWeChat(source);
  assert.deepEqual(saved.articles.map(article => article.id), ['article-one','article-two']);
  assert.equal(saved.articles[0].workId,'grass');
  assert.equal(saved.articles[0].publishedAt,'2026-10-28');
});

test('verified local archive articles may be read before their original URLs are available', () => {
  const saved = validateWeChat(archive());
  assert.equal(saved.accountId,'gh_29c0b927a35c');
  assert.equal(saved.articles[0].url,undefined);
  assert.equal(saved.articles[0].body,'第一段原文');
  assert.throws(() => validateWeChat({...collection(),articles:[{id:'broken',title:'坏链接',url:'https://example.test',body:'原文'}]}),/公开文章链接/);
});

test('confirmed account identifier and verified public home may coexist', () => {
  const verified = archive();
  verified.homeUrl='https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=public';
  assert.ok(validateWeChat(verified).homeUrl);
  assert.throws(() => validateWeChat({...verified,accountId:'gh_not-a-valid-id!'}),/公众号原始 ID/);
});

test('public links strip copied session credentials and reject other hosts and backend routes', () => {
  assert.equal(wechatLink('https://mp.weixin.qq.com/s/example?pass_ticket=private&token=private#wechat_redirect'),'https://mp.weixin.qq.com/s/example');
  assert.ok(wechatLink('https://mp.weixin.qq.com/s?__biz=public&mid=42&idx=1&sn=signature'));
  for (const url of ['javascript:alert(1)','http://mp.weixin.qq.com/s/one','https://mp.weixin.qq.com.evil.test/s/one','https://mp.weixin.qq.com@evil.test/s/one','https://name:password@mp.weixin.qq.com/s/one','https://mp.weixin.qq.com/cgi-bin/home?token=private','https://mp.weixin.qq.com/']) assert.equal(wechatLink(url),'');
});

test('home links are public WeChat profiles or a selected article', () => {
  assert.ok(wechatLink('https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=public','home'));
  assert.equal(wechatLink('https://mp.weixin.qq.com/mp/profile_ext?action=home','home'),'');
  assert.equal(wechatLink('https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=public'),'');
});

test('unsafe images, invalid dates, and duplicate ids are rejected before saving', () => {
  for (const image of ['javascript:alert(1)','//example.com/x.png','../secret.png','assets/%2e%2e/secret.png','assets\\photo.png']) assert.equal(wechatCover(image),'');
  assert.equal(wechatCover('assets/works/grass/poster.webp'),'assets/works/grass/poster.webp');
  assert.ok(wechatCover('https://mmbiz.qpic.cn/mmbiz_jpg/a/640?wx_fmt=jpeg'));
  const date = collection();date.articles[0].publishedAt='2026-02-30';assert.throws(() => validateWeChat(date),/有效/);
  const dup = collection();dup.articles.push({...dup.articles[0],url:'https://mp.weixin.qq.com/s/other'});assert.throws(() => validateWeChat(dup),/id/);
  const cover = collection();cover.articles[0].cover='data:text/html,bad';assert.throws(() => validateWeChat(cover),/封面/);
});

test('empty optional collection does not prevent saving the rest of a profile', () => {
  assert.deepEqual(validateWeChat({name:'',homeUrl:'',articles:[]}),{name:'',articles:[]});
  assert.throws(() => validateWeChat({name:'',articles:collection().articles}),/名称/);
});
