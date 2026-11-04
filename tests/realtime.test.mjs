import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {WebSocket} from 'ws';
const endpoint='ws://127.0.0.1:4192';
const origin='http://127.0.0.1:4176';
const receive=socket=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Expected a message within 3s')),3000);socket.once('message',buffer=>{clearTimeout(timeout);resolve(JSON.parse(buffer.toString()));});});
test('independent clients exchange presence, chat and cursors without impersonation',{timeout:15000},async()=>{
  const child=spawn(process.execPath,['server/realtime.mjs'],{env:{...process.env,PORT:'4192',ALLOWED_ORIGINS:origin},stdio:['ignore','pipe','pipe'],windowsHide:true});
  const clients=[];
  try{
    await once(child.stdout,'data');
    const a=new WebSocket(endpoint,{origin});clients.push(a);await once(a,'open');a.send(JSON.stringify({type:'join',id:'alice',name:'Alice',color:'#63d9ed'}));
    const b=new WebSocket(endpoint,{origin});clients.push(b);await once(b,'open');
    const presence=receive(b),joined=receive(a);b.send(JSON.stringify({type:'join',id:'bob',name:'Bob',color:'#fbad4a'}));
    assert.equal((await presence).id,'alice');assert.equal((await joined).type,'join');
    const chat=receive(a);b.send(JSON.stringify({type:'chat',id:'alice',name:'spoof',text:'hello <script>',messageId:'test-1'}));
    const result=await chat;assert.equal(result.id,'bob');assert.equal(result.name,'Bob');assert.equal(result.text,'hello <script>');
    const cursor=receive(b);a.send(JSON.stringify({type:'cursor',x:3,y:-1}));
    const point=await cursor;assert.equal(point.x,1);assert.equal(point.y,0);
    const left=receive(a);b.close();assert.equal((await left).type,'leave');
  }finally{for(const client of clients)client.terminate();child.kill();await once(child,'exit').catch(()=>{});}
});
test('server rejects origins outside the configured portfolio',{timeout:8000},async()=>{
  const child=spawn(process.execPath,['server/realtime.mjs'],{env:{...process.env,PORT:'4192',ALLOWED_ORIGINS:origin},stdio:['ignore','pipe','pipe'],windowsHide:true});
  try{await once(child.stdout,'data');const client=new WebSocket(endpoint,{origin:'https://unrelated.example'});const [error]=await once(client,'error');assert.match(error.message,/401/);client.terminate();}
  finally{child.kill();await once(child,'exit').catch(()=>{});}
});
