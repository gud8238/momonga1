import * as T from 'three';
import {createMultiplayer} from './multiplayer.js';
import {createInventory} from './inventory.js';
import {createAdventure} from './adventure.js';
import {createNPCs} from './npcs.js';
import {createAudio} from './audio.js';
import {createBiomes} from './worlds.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const renderer=new T.WebGLRenderer({canvas:document.querySelector('#world'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new T.Scene();scene.background=new T.Color('#d5e7e0');scene.fog=new T.Fog('#d5e7e0',45,115);
const camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.1,180);camera.position.set(2,10,19);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=24;controls.maxPolarAngle=Math.PI*.47;controls.target.set(0,1.4,0);
const ambient=new T.HemisphereLight('#fff8df','#729260',2.3);scene.add(ambient);
const sun=new T.DirectionalLight('#fff2cb',3);sun.position.set(-15,25,-12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,far:90});sun.shadow.bias=-.0003;scene.add(sun);scene.add(sun.target);
const biome=createBiomes(scene,sun,ambient);
const obstacles=biome.obstacles;
const player=new T.Group();scene.add(player);const keys=new Set();let airborne=false,altitude=0,elapsed=0,ready=false;const bones={};const bases={};const morphs=[];let glideBlend=0;
let npcs,adventure,started=false,cameraReset=false;
const shakeOffset=new T.Vector3();
const inventory=createInventory();
let pointerAscending=false,landing=false;
const flyButton=document.querySelector('#fly');
function releaseInputs(){keys.clear();pointerAscending=false;}
function requestLanding(){landing=true;pointerAscending=false;}
flyButton.addEventListener('pointerdown',event=>{if(!ready||!started)return;event.preventDefault();pointerAscending=true;landing=false;flyButton.setPointerCapture(event.pointerId);});
for(const eventName of ['pointerup','pointercancel','lostpointercapture'])flyButton.addEventListener(eventName,()=>{pointerAscending=false;});
flyButton.addEventListener('keydown',event=>{if(['Space','Enter'].includes(event.code)){event.preventDefault();pointerAscending=true;landing=false;}});
flyButton.addEventListener('keyup',event=>{if(['Space','Enter'].includes(event.code))pointerAscending=false;});
flyButton.addEventListener('blur',()=>{pointerAscending=false;});
document.querySelector('#land').onclick=requestLanding;
addEventListener('keydown',event=>{
 if(!started)return;
 if(!['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE'].includes(event.code)||(event.target.tagName==='SELECT'||npcs?.talking))return;
 event.preventDefault();keys.add(event.code);
 if(event.code==='KeyQ'&&!event.repeat)landing=false;
 if(event.code==='KeyE')requestLanding();
});
addEventListener('keyup',event=>keys.delete(event.code));
addEventListener('blur',releaseInputs);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInputs();});
try{const gltf=await new GLTFLoader().loadAsync('/assets/momonga.glb');gltf.scene.scale.setScalar(.56);player.add(gltf.scene);gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.morphTargetDictionary?.Glide!==undefined)morphs.push(o);}if(o.isBone){bones[o.name]=o;bases[o.name]=o.quaternion.clone();}});ready=true;document.querySelector('#loading').classList.add('hidden');}catch(error){document.querySelector('#loading').textContent='캐릭터를 불러오지 못했어요. 페이지를 새로고침해 주세요.';console.error(error);}
const audio=await createAudio();
try{npcs=await createNPCs(scene,camera,renderer.domElement,biome,text=>audio.say(text),inventory);}catch(error){document.querySelector('#quest').textContent='NPC를 불러오지 못했습니다. 새로고침해 주세요.';console.error(error);}
adventure=await createAdventure({scene,camera,canvas:renderer.domElement,player,bones,inventory,audio,resetPlayer,movePlayer,isBlocked:()=>!started||!multiplayer.connected||npcs?.talking||!document.querySelector('#inventory').hidden});
const multiplayer=createMultiplayer({scene,camera,player,onDisconnect:()=>{releaseInputs();document.querySelector('#connection-lost').hidden=false;}});
const startButton=document.querySelector('#start-game'),joinForm=document.querySelector('#join-form'),joinButton=document.querySelector('#join-game');
startButton.disabled=false;startButton.textContent='게임 시작';startButton.onclick=()=>{startButton.hidden=true;joinForm.hidden=false;document.querySelector('#player-name').focus();};
joinForm.onsubmit=async event=>{event.preventDefault();const name=document.querySelector('#player-name').value.trim().normalize('NFC');const error=document.querySelector('#join-error');if(!/^[\p{L}\p{N}_ -]{2,12}$/u.test(name)){error.textContent='이름은 한글·영문·숫자 등 2~12글자로 입력해 주세요.';return;}joinButton.disabled=true;joinButton.textContent='친구들을 만나는 중…';error.textContent='';try{await multiplayer.connect(name);started=true;document.body.classList.remove('intro-active');document.querySelector('#intro').hidden=true;resetPlayer();joinButton.blur();}catch(e){error.textContent=e.message;}finally{joinButton.disabled=false;joinButton.textContent='함께 모험하기';}};
for(const button of document.querySelectorAll('[data-emote]'))button.onclick=()=>{multiplayer.emote(button.dataset.emote);button.blur();};
document.querySelector('#leave-game').onclick=()=>{multiplayer.disconnect();location.reload();};document.querySelector('#restart-game').onclick=()=>location.reload();
const clock=new T.Clock(),forward=new T.Vector3(),right=new T.Vector3(),direction=new T.Vector3(),previous=new T.Vector3(),axisX=new T.Vector3(1,0,0),axisY=new T.Vector3(0,1,0),axisZ=new T.Vector3(0,0,1),rotation=new T.Quaternion();
function pose(name,axis,angle){if(bones[name])bones[name].quaternion.copy(bases[name]).multiply(rotation.setFromAxisAngle(axis,angle));}
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;if(!started||!multiplayer.connected){releaseInputs();return;}camera.position.sub(shakeOffset);shakeOffset.set(0,0,0);previous.copy(player.position);camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,T.Object3D.DEFAULT_UP).normalize();direction.set(0,0,0);
 if(keys.has('KeyW'))direction.add(forward);if(keys.has('KeyS'))direction.sub(forward);if(keys.has('KeyD'))direction.add(right);if(keys.has('KeyA'))direction.sub(right);
 if(npcs?.talking||adventure?.dead||!document.querySelector('#inventory').hidden){releaseInputs();direction.set(0,0,0);}
 const ascending=ready&&!npcs?.talking&&!adventure?.dead&&!landing&&(keys.has('KeyQ')||pointerAscending);
 altitude=Math.min(22,Math.max(0,altitude+(ascending?3.2:landing?-4:-2)*dt));
 airborne=altitude>.01;
 if(!airborne){altitude=0;landing=false;}
 if(airborne&&!adventure?.dead&&direction.lengthSq()===0)direction.set(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
 const moving=ready&&direction.lengthSq()>0;
 if(moving){direction.normalize();const speed=altitude>.2?5.4:3;const x=T.MathUtils.clamp(player.position.x+direction.x*speed*dt,-biome.bounds,biome.bounds),z=T.MathUtils.clamp(player.position.z+direction.z*speed*dt,-biome.bounds,biome.bounds);if(!obstacles.some(o=>altitude<(o.h??2)&&Math.hypot(x-o.x,z-o.z)<o.r+.65)){player.position.x=x;player.position.z=z;}const target=Math.atan2(direction.x,direction.z);player.rotation.y+=Math.atan2(Math.sin(target-player.rotation.y),Math.cos(target-player.rotation.y))*Math.min(1,dt*10);}
 glideBlend=T.MathUtils.damp(glideBlend,Math.min(1,altitude/1.2),5,dt);const flyBlend=glideBlend,stride=moving?Math.sin(elapsed*10)*.5:Math.sin(elapsed*2)*.03;
 player.position.y=biome.height(player.position.x,player.position.z)+altitude+(moving?(1-flyBlend)*Math.abs(Math.sin(elapsed*10))*.07:0);
 for(const m of morphs)m.morphTargetInfluences[m.morphTargetDictionary.Glide]=flyBlend;
 pose('left_arm',axisX,-stride*.75*(1-flyBlend));pose('right_arm',axisX,stride*.75*(1-flyBlend));pose('left_foot',axisX,stride*(1-flyBlend));pose('right_foot',axisX,-stride*(1-flyBlend));pose('swept_blue_tail',axisX,Math.sin(elapsed*2)*.05*(1-flyBlend));
 adventure?.update(dt,elapsed);
 const delta=player.position.clone().sub(previous);if(!cameraReset)camera.position.add(delta);cameraReset=false;controls.target.set(player.position.x,player.position.y+1.2,player.position.z);controls.update();sun.position.set(player.position.x-15,25,player.position.z-12);sun.target.position.copy(player.position);
 document.querySelector('#state').textContent=ascending?'날아오르는 중':airborne?'활강하며 내려오는 중':moving?'탐험하는 중':'풀밭에서 쉬는 중';document.querySelector('#height').textContent=`${altitude>.02?'비행':'지상'} · ${altitude.toFixed(1)} m`;
 biome.update(elapsed);npcs?.update(dt,elapsed);audio.update(document.querySelector('#biome').value,document.querySelector('#time').value==='night',moving,airborne);
 multiplayer.update(dt,elapsed,{map:document.querySelector('#biome').value,moving,glide:glideBlend,attack:adventure.state.swing>0});
 shakeOffset.copy(adventure.fx.cameraOffset(elapsed));camera.position.add(shakeOffset);renderer.render(scene,camera);
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.momongaDebug={multiplayer,adventure,inventory,camera,npcs,player,bones,biome,morphs,get glideBlend(){return glideBlend;},get altitude(){return altitude;},get started(){return started;},get ready(){return ready;},renderer};

function resetPlayer(){cameraReset=true;shakeOffset.set(0,0,0);releaseInputs();landing=false;player.rotation.set(0,0,0);player.position.set(0,0,0);camera.position.set(2,10,19);airborne=false;altitude=0;glideBlend=0;controls.target.set(0,1.4,0);}
document.querySelector('#biome').addEventListener('change',event=>{biome.build(event.target.value);npcs?.rebuild(event.target.value);adventure?.rebuild(event.target.value);resetPlayer();});

document.querySelector('#time').addEventListener('change',event=>biome.setNight(event.target.value==='night'));

function movePlayer(dx,dz){const x=T.MathUtils.clamp(player.position.x+dx,-biome.bounds,biome.bounds),z=T.MathUtils.clamp(player.position.z+dz,-biome.bounds,biome.bounds);if(!obstacles.some(o=>altitude<(o.h??2)&&Math.hypot(x-o.x,z-o.z)<o.r+.65)){player.position.x=x;player.position.z=z;}}
