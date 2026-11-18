import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createCombatFX} from './combat-fx.js';
export async function createAdventure({scene,camera,canvas,player,bones,inventory,audio,resetPlayer,isBlocked,movePlayer}){
 const assets=await Promise.all(['anoko','siren'].map(id=>new GLTFLoader().loadAsync(`./assets/${id}.glb`))),encounters={};
 for(const [index,id] of ['anoko','siren'].entries()){
  const asset=assets[index],root=asset.scene;root.visible=false;root.scale.setScalar(id==='anoko'?1.4:1.5);scene.add(root);
  const materials=[];root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.material=o.material.clone();materials.push(o.material);}});
  const mixer=new T.AnimationMixer(root),actions={};for(const clip of asset.animations)actions[clip.name]=mixer.clipAction(clip);
  encounters[id]={root,mixer,actions,materials,name:id==='anoko'?'아노코':'세이렌',reward:id==='anoko'?'breath':'scale',rewardName:id==='anoko'?'아노코의 숨결':'세이렌의 비늘'};
 }
 let enemy=encounters.anoko;
 const fx=createCombatFX(scene),ring=new T.Mesh(new T.RingGeometry(5.7,6,64),new T.MeshBasicMaterial({color:'#ff795e',transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
 const drops=new T.Group();scene.add(drops);
 const quest=document.querySelector('#hunt'),message=document.querySelector('#hunt-text'),accept=document.querySelector('#accept-hunt'),bars=document.querySelector('#health'),fail=document.querySelector('#failure');
 const playerMaterials=[];player.traverse(o=>{if(o.isMesh){o.material=o.material.clone();playerMaterials.push(o.material);}});
 let map='village',phase='absent',spawnTimer=25,foodTimer=8,bossHp=100,playerHp=100,attackClock=0,phaseClock=0,cooldown=0,failureClock=0,flash=0,bossFlash=0,invulnerable=0,swing=0,swingHit=false,messageTimer=0,pickupTimer=0;
 const knockback=new T.Vector3();
 function animate(name,once=false){for(const action of Object.values(enemy.actions))action.stop();const action=enemy.actions[name];if(action){action.reset().setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.play();}}
 function updateBars(){document.querySelector('#boss-hp').value=bossHp;document.querySelector('#player-hp').value=playerHp;document.querySelector('#boss-hp-text').textContent=bossHp+'/100';document.querySelector('#player-hp-text').textContent=playerHp+'/100';}
 function notice(text){message.textContent=text;quest.hidden=false;accept.hidden=true;messageTimer=2;}
 function spawn(){phase='available';enemy.root.visible=true;enemy.root.position.set(T.MathUtils.clamp(player.position.x+8,-28,28),0,T.MathUtils.clamp(player.position.z-9,-32,24));enemy.root.rotation.set(0,0,0);bossHp=100;playerHp=100;quest.hidden=false;accept.hidden=false;document.querySelector('#hunt-title').textContent=enemy.name+' 토벌';document.querySelector('#boss-name').textContent=enemy.name;message.textContent=enemy.name+'이 나타났어요! 토벌에 도전할까요?';messageTimer=0;animate('Idle');}
 accept.onclick=()=>{if(phase!=='available'||isBlocked())return;phase='chase';attackClock=2.5;accept.hidden=true;bars.hidden=false;updateBars();message.textContent='R 공격 · WASD 회피 · 붉은 원 밖으로 피하세요';accept.blur();};
 function setFlash(materials,strength,color){for(const m of materials)if(m.emissive){m.emissive.set(color);m.emissiveIntensity=strength;}}
 function rebuild(value){map=value;phase='absent';for(const e of Object.values(encounters)){e.root.visible=false;e.mixer.stopAllAction();setFlash(e.materials,0,'#ffffff');}enemy=map==='rainforest'?encounters.siren:encounters.anoko;ring.visible=false;quest.hidden=true;bars.hidden=true;fail.hidden=true;spawnTimer=20+Math.random()*25;foodTimer=5+Math.random()*10;failureClock=0;playerHp=100;swing=0;cooldown=0;flash=0;bossFlash=0;invulnerable=0;messageTimer=0;knockback.set(0,0,0);fx.clear();document.querySelector('#pickup').textContent='';for(const o of drops.children)o.visible=o.userData.map===map;}
 function damage(amount){if(!['chase','dance','slam'].includes(phase)||invulnerable>0)return;playerHp=Math.max(0,playerHp-amount);flash=.3;invulnerable=.7;fx.burst(player.position,'#ffca9a',1.2);audio.sfx('impact-hit',.8);knockback.copy(player.position).sub(enemy.root.position);knockback.y=0;if(knockback.lengthSq()<.1)knockback.set(0,0,1);knockback.normalize().multiplyScalar(10);updateBars();if(playerHp===0){phase='failed';swing=0;audio.say('다음에는 꼭 이길 거야!');failureClock=3;fail.hidden=false;document.querySelector('#countdown').textContent='3';ring.visible=false;enemy.mixer.stopAllAction();}}
 function strike(){if(cooldown>0||phase==='failed'||isBlocked())return;cooldown=.52;swing=.44;swingHit=false;audio.sfx('attack-swish',.55);if(['chase','dance','slam'].includes(phase)&&player.position.distanceTo(enemy.root.position)<6)player.rotation.y=Math.atan2(enemy.root.position.x-player.position.x,enemy.root.position.z-player.position.z);}
 function contact(){fx.slash(player.position,player.rotation.y);if(!['chase','dance','slam'].includes(phase))return;const delta=enemy.root.position.clone().sub(player.position);if(delta.length()>5.2)return;const facing=new T.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));delta.y=0;if(delta.lengthSq()>.1&&delta.normalize().dot(facing)<.25)return;
  bossHp=Math.max(0,bossHp-10);bossFlash=.18;fx.burst(enemy.root.position,'#fff0ab',1);audio.sfx('impact-hit',.65);updateBars();if(phase==='chase'){enemy.root.position.addScaledVector(facing,.24);attackClock+=.12;}
  if(bossHp===0){phase='dying';phaseClock=.95;ring.visible=false;bars.hidden=true;animate('Defeat',true);audio.say('해냈다! 오늘도 내가 최고야!');notice('토벌 성공! 잠시 후 '+enemy.rewardName+'이 떨어져요.');}
 }
 addEventListener('keydown',e=>{if(e.code==='KeyR'&&!e.repeat&&!['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();strike();}});
 document.querySelector('#attack').onclick=strike;
 function loot(){const group=new T.Group();group.userData={item:enemy.reward,map,reward:true};const material=new T.MeshStandardMaterial({color:enemy.reward==='scale'?'#f57e89':'#9de9ff',emissive:enemy.reward==='scale'?'#e55d88':'#43b9ef',emissiveIntensity:.7,metalness:.2,roughness:.3});const gem=new T.Mesh(new T.OctahedronGeometry(.44),material);gem.scale.set(1,enemy.reward==='scale'?.6:1.3,.45);gem.position.y=.7;group.add(gem);const halo=new T.Mesh(new T.TorusGeometry(.7,.035,6,32),new T.MeshBasicMaterial({color:'#ffeab4'}));halo.rotation.x=Math.PI/2;halo.position.y=.12;group.add(halo);group.position.copy(enemy.root.position);group.position.y=0;drops.add(group);notice('토벌 성공! '+enemy.rewardName+'을 클릭해서 주워 주세요.');}
 function food(){if(drops.children.filter(o=>o.userData.map==='forest'&&!o.userData.reward).length>=8)return;const pudding=Math.random()<.5,group=new T.Group();group.userData={item:pudding?'pudding':'riceball',map:'forest'};
  const base=new T.Mesh(pudding?new T.CylinderGeometry(.32,.43,.5,12):new T.ConeGeometry(.48,.7,3),new T.MeshStandardMaterial({color:pudding?'#ffe6a0':'#fff9e8',roughness:.8}));base.position.y=.35;group.add(base);
  const topping=new T.Mesh(pudding?new T.CylinderGeometry(.33,.33,.08,12):new T.BoxGeometry(.25,.25,.08),new T.MeshStandardMaterial({color:pudding?'#9b5932':'#354a31'}));topping.position.set(0,pudding?.63:.25,pudding?0:.27);group.add(topping);
  const lake=Math.random()<.45;group.position.set(lake?20.4+(Math.random()-.5)*7:player.position.x+(Math.random()-.5)*18,0,lake?-20.4+(Math.random()-.5)*6:player.position.z+(Math.random()-.5)*18);drops.add(group);
 }
 const ray=new T.Raycaster(),pointer=new T.Vector2();let start=null;
 canvas.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);
 canvas.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>6)return;start=null;if(isBlocked()||phase==='failed')return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(drops.children.filter(o=>o.visible),true)[0];if(!hit)return;let item=hit.object;while(item.parent!==drops)item=item.parent;inventory.add(item.userData.item);if(item.userData.reward){audio.say('반짝반짝, 보물이다!');notice((item.userData.item==='scale'?'세이렌의 비늘':'아노코의 숨결')+'을 인벤토리에 넣었어요.');}else{audio.say('맛있겠다!');document.querySelector('#pickup').textContent='모몽가 · 맛있겠다!';pickupTimer=2;}
  drops.remove(item);item.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});});
 return {rebuild,get dead(){return phase==='failed';},get boss(){return enemy.root;},get state(){return {phase,bossHp,playerHp,spawnTimer,foodTimer,swing,bossFlash,enemy:enemy.name};},drops,fx,update(dt,time){
  cooldown=Math.max(0,cooldown-dt);invulnerable=Math.max(0,invulnerable-dt);flash=Math.max(0,flash-dt);bossFlash=Math.max(0,bossFlash-dt);fx.update(dt);enemy.mixer.update(dt*(bossFlash>0?.18:1));
  if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)quest.hidden=true;}if(pickupTimer>0){pickupTimer-=dt;if(pickupTimer<=0)document.querySelector('#pickup').textContent='';}
  document.querySelector('#damage-flash').style.opacity=flash>0?String(flash):'0';setFlash(playerMaterials,flash>0?.8:0,'#ff8a69');setFlash(enemy.materials,bossFlash>0?1.4:0,'#fff0bf');
  if(knockback.lengthSq()>.01){movePlayer(knockback.x*dt,knockback.z*dt);knockback.multiplyScalar(Math.exp(-dt*10));}
  if(swing>0){const before=swing;swing=Math.max(0,swing-dt);if(!swingHit&&before>.29&&swing<=.29){swingHit=true;contact();}}
  const model=player.children[0];if(model){model.rotation.z=flash>0?Math.sin(time*65)*.14:0;model.rotation.x=swing>0?Math.sin((.44-swing)/.44*Math.PI)*.22:0;}
  if(swing>0){const t=(.44-swing)/.44,k=Math.sin(t*Math.PI);bones.right_arm?.rotateX(-2.4*k);bones.left_arm?.rotateX(-1.25*k);bones.right_arm?.rotateZ(-.5*k);}
  for(const o of drops.children)if(o.visible){o.position.y=.08+Math.sin(time*2+o.position.x)*.07;if(o.userData.reward)o.rotation.y+=dt*.8;}
  if(map==='forest'){foodTimer-=dt;if(foodTimer<=0){food();foodTimer=12+Math.random()*20;}}
  if(!['cave','rainforest'].includes(map))return;
  if(phase==='absent'){spawnTimer-=dt;if(spawnTimer<=0)spawn();return;}
  if(phase==='failed'){failureClock-=dt;document.querySelector('#countdown').textContent=String(Math.max(0,Math.ceil(failureClock)));if(failureClock<=0){rebuild(map);resetPlayer();}return;}
  if(phase==='dying'){phaseClock-=dt;if(phaseClock<=0){phase='blinking';phaseClock=2;enemy.root.visible=true;}return;}
  if(phase==='blinking'){phaseClock-=dt;enemy.root.visible=Math.floor((2-Math.max(0,phaseClock))/.5)%2===0;if(phaseClock<=0){loot();phase='absent';enemy.root.visible=false;spawnTimer=65+Math.random()*35;enemy.mixer.stopAllAction();}return;}
  if(phase==='available')return;
  const dx=player.position.x-enemy.root.position.x,dz=player.position.z-enemy.root.position.z,distance=Math.hypot(dx,dz);
  if(phase==='chase'){
   enemy.root.rotation.y=Math.atan2(dx,dz);
   if(distance>3&&bossFlash<=0){enemy.root.position.x+=dx/distance*1.55*dt;enemy.root.position.z+=dz/distance*1.55*dt;}
   attackClock-=dt;if(attackClock<=0){phase='dance';phaseClock=map==='cave'?3.8:2.2;ring.position.set(enemy.root.position.x,.12,enemy.root.position.z);ring.visible=true;animate(map==='cave'?'Dance':'Charge');audio.say('조심해! 큰 공격이 온다!');message.textContent=enemy.name+'의 큰 공격! 붉은 원 밖으로 피하세요.';}
  }else if(phase==='dance'){
   phaseClock-=dt;ring.material.opacity=.45+Math.sin(time*10)*.2;if(phaseClock<=0){phase='slam';phaseClock=.85;animate('Slam',true);}
  }else if(phase==='slam'){
   const before=phaseClock;phaseClock-=dt;if(before>.35&&phaseClock<=.35){audio.sfx(map==='cave'?'impact-slam':'impact-water',.8);fx.wave(enemy.root.position,map==='cave'?'#ffc888':'#8eeeff');fx.burst(enemy.root.position,map==='cave'?'#d8bc8e':'#8eeeff',1.6);if(distance<6&&player.position.y<3)damage(34);}
   if(phase!=='failed'&&phaseClock<=0){phase='chase';attackClock=3+Math.random()*2;ring.visible=false;animate('Idle');message.textContent='R 공격 · WASD 회피 · Q를 눌러 공중으로 피할 수도 있어요.';}
  }
 }};
}
