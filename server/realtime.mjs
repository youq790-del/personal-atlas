import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
const port=Number(process.env.PORT||4175);
const allowed=(process.env.ALLOWED_ORIGINS||'http://127.0.0.1:4174,http://localhost:4174,http://127.0.0.1:4176').split(',');
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'ok',service:'personal-atlas-realtime'}));});
const wss=new WebSocketServer({server,maxPayload:4096,verifyClient:({origin})=>allowed.includes(origin)});
const peers=new Map();
function broadcast(message,except){for(const [client,p]of peers)if(client!==except&&client.readyState===WebSocket.OPEN&&p.room===message.room)client.send(JSON.stringify(message));}
wss.on('connection',socket=>{
  let profile=null,windowStart=Date.now(),messages=0,chatAt=0;
  socket.alive=true;socket.on('pong',()=>socket.alive=true);
  socket.on('message',buffer=>{
    if(Date.now()-windowStart>1000){windowStart=Date.now();messages=0;}
    if(++messages>35)return;
    let data;try{data=JSON.parse(buffer.toString());}catch{return;}
    if(!data||!['join','presence','cursor','chat','leave'].includes(data.type))return;
    if(!profile){
      if(data.type!=='join'||typeof data.id!=='string'||typeof data.name!=='string'||!/^#[\da-f]{6}$/i.test(data.color||''))return;
      if([...peers.values()].some(p=>p.id===data.id))return socket.close(1008,'Duplicate identity');
      profile={id:data.id.slice(0,80),name:data.name.slice(0,32),color:data.color,room:'personal-atlas'};
      for(const p of peers.values())socket.send(JSON.stringify({...p,type:'presence'}));peers.set(socket,profile);
    }
    const message={...profile,type:data.type};
    if(data.type==='cursor'){
      if(!Number.isFinite(data.x)||!Number.isFinite(data.y))return;
      message.x=Math.max(0,Math.min(1,data.x));message.y=Math.max(0,Math.min(1,data.y));
    }
    if(data.type==='chat'){
      if(typeof data.text!=='string'||!data.text.trim()||Date.now()-chatAt<700)return;
      chatAt=Date.now();message.text=data.text.trim().slice(0,500);message.at=Date.now();message.messageId=typeof data.messageId==='string'?data.messageId.slice(0,80):randomUUID();
    }
    broadcast(message,socket);
  });
  socket.on('close',()=>{if(profile){peers.delete(socket);broadcast({...profile,type:'leave'},socket);}});
});
const heartbeat=setInterval(()=>{for(const socket of wss.clients){if(!socket.alive){socket.terminate();continue;}socket.alive=false;socket.ping();}},15000);
wss.on('close',()=>clearInterval(heartbeat));
server.listen(port,'0.0.0.0',()=>console.log(`Realtime server listening on ${port}`));
