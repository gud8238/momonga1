import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

export async function createNPCs(scene,camera,canvas,biome,onDialogue,inventory){
 const types=['chiikawa','hachiware','resident_cream','resident_peach','yoroi'];
 const models=await Promise.all(types.map(name=>new GLTFLoader().loadAsync(`./assets/${name}.glb`)));
 const group=new T.Group();scene.add(group);
 const actors=[],herbs=[];let selected=null,map='village',quest=inventory.state.quest,collected=inventory.state.collected,pauseTimer=0;
 const panel=document.querySelector('#dialogue'),nameEl=document.querySelector('#speaker'),lineEl=document.querySelector('#line'),choices=document.querySelector('#choices');
 const names={chiikawa:'치이카와',hachiware:'하치와레',resident_cream:'크림 주민',resident_peach:'복숭아 주민',yoroi:'갑옷아저씨'};
 const lines={chiikawa:'와아…! 오늘도 같이 산책할래?',hachiware:'저기 반짝이는 길이 보여? 같이 탐험하면 더 재미있겠다!',resident_cream:'풀잎 냄새가 참 좋아. 천천히 둘러보고 있어.',resident_peach:'안녕! 나도 여기저기 구경하는 중이야.'};
 const basic=new T.MeshStandardMaterial({color:'#9b7951',roughness:.9});
 function box(w,h,d,x,y,z){const o=new T.Mesh(new T.BoxGeometry(w,h,d),basic);o.position.set(x,y,z);o.castShadow=true;group.add(o);return o;}
 function label(text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#fff7dd';ctx.fillRect(0,0,512,100);ctx.fillStyle='#3c533e';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,62);const tex=new T.CanvasTexture(c);const o=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:true}));o.scale.set(4.6,.9,1);o.position.set(x,y,z);group.add(o);return o;}
 function close(){panel.hidden=true;selected=null;choices.replaceChildren();}
 function say(text){lineEl.textContent=text;onDialogue?.(text);}
 function choice(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;choices.append(b);}
 function talk(actor){selected=actor;nameEl.textContent=actor.name;panel.hidden=false;choices.replaceChildren();
  if(actor.type==='yoroi'){
   if(quest==='none'){say('마을에 쓸 반짝풀 세 포기가 필요하단다. 게시판 주변에서 찾아 줄래?');choice('내가 모아 올게!',()=>{quest='active';inventory.state.quest=quest;inventory.save();say('고맙다! 빛나는 풀 세 포기를 클릭해서 모으고 다시 와 주렴.');choices.replaceChildren();choice('출발!',close);});}
   else if(quest==='active'){say(`지금 ${collected}/3포기 모았구나. 조금만 더 부탁한다!`);}
   else if(quest==='ready'){say('잘했구나! 덕분에 마을이 한결 밝아지겠어. 오늘의 일거리 완료야!');quest='complete';inventory.state.quest=quest;inventory.save();document.querySelector('#quest').textContent='반짝풀 의뢰 완료 · 수고했어요!';}
   else say('오늘도 고맙다. 친구들과 즐겁게 둘러보렴.');
   choice('아이템 팔기',()=>{const earned=inventory.sell();say(earned?`${earned}코인을 받았어! 또 가져오렴.`:'팔 수 있는 아이템이 없구나. 의뢰 중인 반짝풀은 완료 후 팔 수 있어.');});
  }else{say(lines[actor.type]);choice('같이 돌아다니자!',()=>{say(actor.type==='chiikawa'?'응! 헤헤… 같이 가자!':'좋아! 나도 이 길을 따라 가 볼게.');choices.replaceChildren();choice('또 만나!',close);});choice('무슨 일이 있어?',()=>{say(map==='village'?'갑옷아저씨가 게시판 근처에서 일손을 찾고 있대.':map==='cave'?'파란 수정 옆에 있으면 은은하게 빛나. 참 신기하지?':'폭포 근처에 큰 버섯이 있어. 그늘에서 쉬기 좋아!');choices.replaceChildren();choice('알려 줘서 고마워!',close);});}
  choice('대화 마치기',close);
 }
 document.querySelector('#close-dialogue').onclick=close;addEventListener('keydown',e=>{if(e.code==='Escape')close();});
 function target(actor){const radius=actor.type==='yoroi'?5:Math.min(40,biome.bounds*.65);for(let i=0;i<30;i++){const x=actor.home.x+(Math.random()-.5)*radius,z=actor.home.z+(Math.random()-.5)*radius;if(!biome.obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+1)){actor.target.set(x,0,z);return;}}actor.target.copy(actor.object.position);}
 function rebuild(value){map=value;close();group.traverse(o=>{if(o.userData.npc)return;if(o.isSprite){o.material.map.dispose();o.material.dispose();}if(o.geometry)o.geometry.dispose();});group.clear();actors.length=0;herbs.length=0;
  const layout=[[-3,-3],[3,-5],[-5,2],[5,3],[-4,-12],[4,-15],[-5,13],[4,17],[-3,-25],[3,-30]];
  layout.forEach(([x,z],i)=>{const type=types[i<2?i:2+i%2],object=clone(models[types.indexOf(type)].scene);object.scale.setScalar(.85);object.position.set(x,0,z);group.add(object);const bones={},rest={};object.traverse(o=>{o.userData.npc=true;if(o.isBone){bones[o.name]=o;rest[o.name]=o.quaternion.clone();}if(o.isMesh)o.castShadow=true;});const actor={object,type,name:names[type],bones,rest,home:object.position.clone(),target:new T.Vector3(),wait:Math.random()*2,speed:.55+Math.random()*.35};actors.push(actor);target(actor);});
  if(value==='village'){
   box(4,.2,1.5,-7,1,6);box(.2,3,.2,-9,1.5,6.7);box(.2,3,.2,-5,1.5,6.7);box(4,1.4,.15,-7,2.4,6.7);label('갑옷아저씨의 일거리',-7,3.8,6.7);
   const object=clone(models[4].scene);object.scale.setScalar(1.25);object.position.set(-7,0,4);group.add(object);const bones={},rest={};object.traverse(o=>{o.userData.npc=true;if(o.isBone){bones[o.name]=o;rest[o.name]=o.quaternion.clone();}if(o.isMesh)o.castShadow=true;});const actor={object,type:'yoroi',name:names.yoroi,bones,rest,home:object.position.clone(),target:new T.Vector3(),wait:2,speed:.5};actors.push(actor);target(actor);
   for(let i=collected;i<3;i++){const herb=new T.Mesh(new T.OctahedronGeometry(.38),new T.MeshStandardMaterial({color:'#d8f18d',emissive:'#99cf44',emissiveIntensity:.5}));herb.position.set(-3-i*1.4,.5,7+i*3);herb.userData.herb=true;group.add(herb);herbs.push(herb);}
  }
 }
 const ray=new T.Raycaster(),pointer=new T.Vector2();let down=null;
 canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;down=null;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...actors.map(a=>a.object),...herbs],true)[0];if(!hit)return;
  if(hit.object.userData.herb){if(quest!=='active'){document.querySelector('#quest').textContent='갑옷아저씨에게 먼저 일거리를 받아 주세요.';return;}group.remove(hit.object);herbs.splice(herbs.indexOf(hit.object),1);hit.object.geometry.dispose();hit.object.material.dispose();collected++;inventory.add('herb');inventory.state.collected=collected;if(collected===3)quest='ready';inventory.state.quest=quest;inventory.save();document.querySelector('#quest').textContent=collected===3?'반짝풀 3/3 · 갑옷아저씨에게 돌아가세요':`반짝풀 ${collected}/3`;return;}
  const actor=actors.find(a=>{let o=hit.object;while(o){if(o===a.object)return true;o=o.parent;}return false;});if(actor)talk(actor);
 });
 rebuild('village');
 return {actors,rebuild,close,get talking(){return !panel.hidden;},update(dt,time){
  for(const a of actors){if(a===selected)continue;a.wait-=dt;if(a.wait>0)continue;const delta=a.target.clone().sub(a.object.position);delta.y=0;const moving=delta.length()>.3;
   if(moving){delta.normalize();const next=a.object.position.clone().addScaledVector(delta,a.speed*dt);const blocked=biome.obstacles.some(o=>Math.hypot(next.x-o.x,next.z-o.z)<o.r+.65)||actors.some(b=>b!==a&&b.object.position.distanceTo(next)<.85);
    if(blocked){target(a);a.wait=.4;}else{a.object.position.copy(next);const angle=Math.atan2(delta.x,delta.z);a.object.rotation.y+=Math.atan2(Math.sin(angle-a.object.rotation.y),Math.cos(angle-a.object.rotation.y))*Math.min(1,dt*5);}
   }else{target(a);a.wait=1+Math.random()*3;}
   for(const [name,bone] of Object.entries(a.bones)){bone.quaternion.copy(a.rest[name]);if(name.includes('arm')||name.includes('leg')){const sign=(name.includes('left')?1:-1)*(name.includes('arm')?-1:1);bone.rotateX(moving?Math.sin(time*7)*.3*sign:0);}}
  }
  if(quest==='active')document.querySelector('#quest').textContent=`반짝풀 ${collected}/3 · 빛나는 풀을 클릭해 모으세요`;
  herbs.forEach(h=>{h.rotation.y=time;h.position.y=.55+Math.sin(time*2)*.08;});
 }};
}
