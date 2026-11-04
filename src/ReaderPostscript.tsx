import { useState } from 'react';
import { Icon } from './Icon';
import { wechatLink, type WeChatCollection } from './wechat';

export function ReaderPostscript({collection,onRead,onChat}:{collection?:WeChatCollection;onRead:()=>void;onChat:()=>void}) {
  const [copied,setCopied]=useState(false),[notice,setNotice]=useState('');
  const account=collection?.accountId;
  const home=wechatLink(collection?.homeUrl,'home');
  const copy=async()=>{
    if(!account)return;
    try{await navigator.clipboard.writeText(account);setCopied(true);setNotice('已复制，去微信搜索即可。');}
    catch{setNotice(`请在微信搜索：${account}`);}
  };
  return <div className="reader-postscript">
    <div className="reader-postscript-note">
      <p>公众号见。</p>
      <button className="editorial-link" onClick={onRead}><span>读文章</span><Icon name="arrow-right-up-linear"/></button>
    </div>
    <div className={`reader-bookmark ${copied?'is-copied':''}`}>
      <span className="bookmark-fold" aria-hidden="true"/>
      <p className="reader-bookmark-name">{collection?.name||'公众号'}</p>
      {account&&<><span className="reader-bookmark-id">{account}</span><button className="bookmark-copy" onClick={copy}><span>{copied?'已复制':'复制账号'}</span><Icon name={copied?'check-circle-linear':'copy-linear'} size={20}/></button></>}
      {home&&<a className="editorial-link" href={home} target="_blank" rel="noopener noreferrer"><span>打开公众号</span><Icon name="arrow-right-up-linear"/></a>}
      <p className="bookmark-status" role="status">{notice||(account?'在微信搜索账号。':'文章可在本站阅读。')}</p>
    </div>
    <button className="local-chat-link" onClick={onChat}>本地聊天室 <Icon name="chat-round-dots-linear" size={16}/></button>
  </div>;
}
