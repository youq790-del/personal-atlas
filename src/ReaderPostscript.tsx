import { useState } from 'react';
import { Icon } from './Icon';
import { wechatLink, type WeChatCollection } from './wechat';

export function ReaderPostscript({collection,onRead,onChat}:{collection?:WeChatCollection;onRead:()=>void;onChat:()=>void}) {
  const [copied,setCopied]=useState(false),[notice,setNotice]=useState('');
  const account=collection?.accountId;
  const home=wechatLink(collection?.homeUrl,'home');
  const copy=async()=>{
    if(!account)return;
    try{await navigator.clipboard.writeText(account);setCopied(true);setNotice('账号已复制。打开微信，搜索这个账号。');}
    catch{setNotice(`请在微信搜索：${account}`);}
  };
  return <div className="reader-postscript">
    <div className="reader-postscript-note">
      <p>关于我的下一页，<br/>还会继续写。</p>
      <button className="editorial-link" onClick={onRead}><span>再读一篇</span><Icon name="arrow-right-up-linear"/></button>
    </div>
    <div className={`reader-bookmark ${copied?'is-copied':''}`}>
      <span className="bookmark-fold" aria-hidden="true"/>
      <p className="reader-bookmark-name">{collection?.name||'我的文字'}</p>
      {account&&<><span className="reader-bookmark-id">{account}</span><button className="bookmark-copy" onClick={copy}><span>{copied?'已记下，下次见':'带走这个账号'}</span><Icon name={copied?'check-circle-linear':'copy-linear'} size={20}/></button></>}
      {home&&<a className="editorial-link" href={home} target="_blank" rel="noopener noreferrer"><span>打开公众号</span><Icon name="arrow-right-up-linear"/></a>}
      <p className="bookmark-status" role="status">{notice||(account?'在微信搜索，继续认识我。':'从已归档的文章继续读起。')}</p>
    </div>
    <button className="local-chat-link" onClick={onChat}>玩一会儿本地聊天室 <Icon name="chat-round-dots-linear" size={16}/></button>
  </div>;
}
