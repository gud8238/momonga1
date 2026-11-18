import { DurableObject } from 'cloudflare:workers';
const MAX_PLAYERS=20,MAPS=new Set(['village','forest','cave','rainforest']);
const validName=s=>typeof s==='string'&&/^[\p{L}\p{N}_ -]{2,12}$/u.test(s)&&s===s.trim();
export class GameRoom extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));}
 sockets(){return this.ctx.getWebSockets().filter(ws=>ws.readyState===1);}
 players(){return this.sockets().map(ws=>ws.deserializeAttachment()).filter(p=>p?.name);}
 send(ws,data){try{ws.send(JSON.stringify(data));}catch{}}
 broadcast(data,except){for(const ws of this.sockets())if(ws!==except)this.send(ws,data);}
 prune(){const now=Date.now();for(const ws of this.sockets()){const p=ws.deserializeAttachment();const pong=this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime()||0;if(now-Math.max(p?.seen||0,pong)>(p?.name?65000:10000))ws.close(4000,'Session expired');}}
 async fetch(request){this.prune();if(this.sockets().length>=MAX_PLAYERS)return new Response('Room is full',{status:503});const [client,server]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(server);server.serializeAttachment({id:crypto.randomUUID(),name:'',seen:Date.now(),joined:Date.now(),tokens:12,bucket:Date.now(),lastMove:0,lastEmote:0,x:0,y:0,z:0,yaw:0,map:'village',glide:0,moving:false,attack:false});return new Response(null,{status:101,webSocket:client});}
 webSocketMessage(ws,raw){if(typeof raw!=='string'||raw.length>512){ws.close(1008,'Invalid packet');return;}let msg;try{msg=JSON.parse(raw);}catch{ws.close(1008,'Invalid JSON');return;}
  const p=ws.deserializeAttachment(),now=Date.now();if(!p)return;const tokens=Math.min(12,p.tokens+(now-p.bucket)/1000*7)-1;p.bucket=now;p.tokens=tokens;p.seen=now;
  if(tokens<0){ws.close(1008,'Too many messages');return;}
  if(!p.name){if(msg.type!=='join'||!validName(msg.name)||now-p.joined>10000){ws.close(1008,'Invalid name');return;}p.name=msg.name;p.tokens=12;ws.serializeAttachment(p);this.send(ws,{type:'welcome',id:p.id,players:this.players().map(this.publicPlayer),capacity:MAX_PLAYERS});this.broadcast({type:'join',player:this.publicPlayer(p)},ws);return;}
  if(msg.type==='move'){
   if(now-p.lastMove<160){ws.serializeAttachment(p);return;}
   if(!MAPS.has(msg.map)||![msg.x,msg.y,msg.z,msg.yaw,msg.glide].every(Number.isFinite)||Math.abs(msg.x)>112||Math.abs(msg.z)>112||msg.y<-.5||msg.y>30||Math.abs(msg.yaw)>Math.PI*2||msg.glide<0||msg.glide>1){ws.close(1008,'Invalid position');return;}
   Object.assign(p,{x:msg.x,y:msg.y,z:msg.z,yaw:msg.yaw,glide:msg.glide,map:msg.map,moving:!!msg.moving,attack:!!msg.attack,lastMove:now});ws.serializeAttachment(p);this.broadcast({type:'move',player:this.publicPlayer(p)},ws);
  }else if(msg.type==='emote'){
   if(!['wave','cheer'].includes(msg.emote)||now-p.lastEmote<1500){ws.serializeAttachment(p);return;}p.lastEmote=now;ws.serializeAttachment(p);this.broadcast({type:'emote',id:p.id,emote:msg.emote});
  }else{ws.close(1008,'Unknown message');}
 }
 publicPlayer(p){return{id:p.id,name:p.name,x:p.x,y:p.y,z:p.z,yaw:p.yaw,map:p.map,glide:p.glide,moving:p.moving,attack:p.attack};}
 webSocketClose(ws,code){const p=ws.deserializeAttachment();try{ws.close(code===1005?1000:code,'Session ended');}catch{}if(p?.name)this.broadcast({type:'leave',id:p.id},ws);}
 webSocketError(ws){try{ws.close(1011,'Connection error');}catch{}const p=ws.deserializeAttachment();if(p?.name)this.broadcast({type:'leave',id:p.id},ws);}
}
export default {async fetch(request,env,ctx){const url=new URL(request.url);if(url.pathname==='/api/health')return Response.json({ok:true,capacity:MAX_PLAYERS,persistence:false});if(url.pathname==='/api/ws'){if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});if(request.headers.get('Origin')!==url.origin)return new Response('Origin denied',{status:403});return ctx.exports.GameRoom.getByName('public-world-v1').fetch(request);}return new Response('Not found',{status:404});}};
