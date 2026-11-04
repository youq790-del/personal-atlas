import { useCallback, useEffect, useRef, useState } from 'react';
export type Peer={id:string;name:string;color:string;x?:number;y?:number;seen:number};
export type ChatMessage={id:string;name:string;color:string;text:string;at:number;messageId:string};
const palette=['#63d9ed','#fbad4a','#a2dd78','#d3a0fc','#fa94ac'];
export function useRoom() {
  const me=useRef<Peer>({id:crypto.randomUUID(),name:`访客 ${Math.floor(100+Math.random()*900)}`,color:palette[Math.floor(Math.random()*palette.length)],seen:Date.now()});
  const [peers,setPeers]=useState<Peer[]>([]);const [messages,setMessages]=useState<ChatMessage[]>([]);const [mode,setMode]=useState<'local'|'connecting'|'online'>('local');
  const transmit=useRef<(payload:Record<string,unknown>)=>void>(()=>{});
  useEffect(()=>{
    const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('personal-space-v2'):null;
    const endpoint=import.meta.env.VITE_REALTIME_URL || (import.meta.env.DEV ? `ws://${location.hostname}:4175`:'');
    const seen=new Set<string>();const map=new Map<string,Peer>();let socket:WebSocket|undefined,retry:number|undefined,disposed=false,last=0;
    const publish=()=>setPeers([...map.values()]);
    const receive=(raw:unknown)=>{
      if(!raw||typeof raw!=='object')return;
      const data=raw as Record<string,unknown>;
      if(typeof data.id!=='string'||data.id===me.current.id||typeof data.name!=='string'||typeof data.color!=='string'||!/^#[\da-f]{6}$/i.test(data.color))return;
      if(data.type==='leave'){map.delete(data.id);publish();return;}
      if(!['join','presence','cursor','chat'].includes(String(data.type)))return;
      const peer={id:data.id,name:data.name.slice(0,32),color:data.color,seen:Date.now(),x:typeof data.x==='number'?Math.max(0,Math.min(1,data.x)):map.get(data.id)?.x,y:typeof data.y==='number'?Math.max(0,Math.min(1,data.y)):map.get(data.id)?.y};
      map.set(peer.id,peer);publish();
      if(data.type==='join')transmit.current({type:'presence'});
      if(data.type==='chat'&&typeof data.text==='string'&&typeof data.messageId==='string'&&!seen.has(data.messageId)){
        seen.add(data.messageId);if(seen.size>300)seen.delete(seen.values().next().value!);
        const text=data.text.slice(0,500),messageId=data.messageId;
        setMessages(previous=>[...previous,{...peer,text,at:Date.now(),messageId}].slice(-100));
      }
    };
    transmit.current=(payload)=>{
      const message={...me.current,...payload,room:'personal-atlas'};
      // WebSocket is authoritative when connected; BroadcastChannel is fallback only.
      if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(message));else channel?.postMessage(message);
    };
    if(channel)channel.onmessage=e=>{if(socket?.readyState!==WebSocket.OPEN)receive(e.data);};
    const connect=()=>{
      if(!endpoint||disposed)return;setMode('connecting');
      try{socket=new WebSocket(endpoint);}catch{setMode('local');return;}
      socket.onopen=()=>{map.clear();publish();setMode('online');transmit.current({type:'join'});};
      socket.onmessage=e=>{try{receive(JSON.parse(e.data));}catch{/* Ignore malformed peer messages. */}};
      socket.onclose=()=>{if(disposed)return;setMode('local');map.clear();publish();retry=window.setTimeout(connect,10000);};
    };
    connect();transmit.current({type:'join'});
    const cursor=(e:PointerEvent)=>{const now=performance.now();if(now-last<50||document.hidden)return;last=now;transmit.current({type:'cursor',x:e.clientX/innerWidth,y:e.clientY/innerHeight});};
    const interval=window.setInterval(()=>{transmit.current({type:'presence'});for(const [id,p]of map)if(Date.now()-p.seen>20000)map.delete(id);publish();},7000);
    window.addEventListener('pointermove',cursor,{passive:true});
    return()=>{transmit.current({type:'leave'});disposed=true;clearInterval(interval);clearTimeout(retry);window.removeEventListener('pointermove',cursor);channel?.close();socket?.close();transmit.current=()=>{};};
  },[]);
  const send=useCallback((text:string)=>{
    const trimmed=text.trim().slice(0,500);if(!trimmed)return;
    const message={...me.current,text:trimmed,at:Date.now(),messageId:crypto.randomUUID()};
    transmit.current({...message,type:'chat'});setMessages(previous=>[...previous,message].slice(-100));
  },[]);
  return {peers,messages,mode,send,me:me.current};
}
