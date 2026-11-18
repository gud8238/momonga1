import * as T from 'three';

export function createBiomes(scene,sun,ambient){
 const world=new T.Group();scene.add(world);
 const obstacles=[],materials=new Map();let seed=88,motes,bounds=65,currentType='village',night=false;
 const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 function mat(color,glow=false){const key=color+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,flatShading:true,roughness:.85,emissive:glow?color:0,emissiveIntensity:glow?.65:0}));return materials.get(key);}
 function mesh(geometry,color,x,y,z,parent=world,glow=false){const o=new T.Mesh(geometry,mat(color,glow));o.position.set(x,y,z);o.castShadow=!glow;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const rock=(r,c,x,y,z,p)=>mesh(new T.IcosahedronGeometry(r,0),c,x,y,z,p);
 function beam(a,b,r,c,p=world){const start=new T.Vector3(...a),end=new T.Vector3(...b),mid=start.clone().add(end).multiplyScalar(.5);const o=mesh(new T.CylinderGeometry(r,r*1.1,start.distanceTo(end),6),c,...mid.toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return o;}
 const block=(x,z,r,h=8)=>obstacles.push({x,z,r,h});
 function tree(x,z,s=1,giant=false){const h=(giant?10:4.5)*s;beam([x,0,z],[x+.4,h,z],(giant?.85:.28)*s,'#806046');for(let i=0;i<4;i++){const px=x+Math.cos(i*1.9)*s*(giant?3:1.2),pz=z+Math.sin(i*1.9)*s*(giant?3:1.2);beam([x,h*.6,z],[px,h,pz],.13*s,'#806046');const crown=rock((giant?3.8:2)*s,giant?(i%2?'#376f50':'#52865a'):(i%2?'#91aa56':'#afbc6a'),px,h,pz);crown.scale.y=.72;}block(x,z,giant?s:.45*s,h);}
 function crystal(x,z,s,color,y=0){for(let i=0;i<4;i++){const h=s*(i?1+random():2.1),cx=x+(i?(random()-.5)*s:0),cz=z+(i?(random()-.5)*s:0);mesh(new T.CylinderGeometry(.20*s,.35*s,h,5),color,cx,y+h/2,cz,world,true);mesh(new T.ConeGeometry(.21*s,.55*s,5),color,cx,y+h+.25*s,cz,world,true);}block(x,z,s*.6,y+s*2.4);}
 function path(color,length=75){const count=Math.floor(length/.9)*5,dummy=new T.Object3D(),stones=new T.InstancedMesh(new T.CylinderGeometry(.53,.58,.10,6),mat(color),count);for(let i=0;i<count;i++){const z=-length/2+Math.floor(i/5)*.9;dummy.position.set(1.5*Math.sin(z*.12)+(i%5-2)*.87,.06,z+random()*.16);dummy.rotation.y=random()*3;dummy.scale.set(.85+random()*.2,1,.85+random()*.2);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);}stones.receiveShadow=true;world.add(stones);}
 function house(x,z,color,angle=0){const p=new T.Group();p.position.set(x,0,z);p.rotation.y=angle;world.add(p);box(4.5,.5,4,'#aaa58e',0,.25,0,p);box(4.2,3.6,3.7,'#eedab0',0,2.1,0,p);
  const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([-2.1,3.9,1.86,2.1,3.9,1.86,0,5.8,1.86],3));gable.computeVertexNormals();mesh(gable,'#eedab0',0,0,0,p);
  for(const side of [-1,1]){const roof=box(3.3,.17,4.5,color,side*1.15,4.85,0,p);roof.rotation.z=-side*.68;for(let j=0;j<5;j++){const tile=box(.065,.08,4.5,'#805b46',side*(.25+j*.46),5.6-j*.37,0,p);tile.rotation.z=-side*.68;}
   box(.17,3.8,.17,'#78553d',side*2.05,2.1,1.94,p);box(1,1.05,.15,'#78553d',side*1.25,2.3,1.94,p);box(.78,.82,.16,'#badbd2',side*1.25,2.3,2.03,p);box(.06,.84,.18,'#78553d',side*1.25,2.3,2.13,p);box(.8,.06,.18,'#78553d',side*1.25,2.3,2.13,p);box(1.2,.3,.5,'#a18154',side*1.25,1.55,2.15,p);for(let j=0;j<3;j++)rock(.17,'#df9e99',side*1.25-.33+j*.33,1.8,2.18,p);}
  box(1,2.1,.17,'#79583e',0,1.4,1.98,p);box(4.15,.13,.18,'#79583e',0,3.5,1.95,p);const awning=box(2.4,.13,1.1,color,0,3.1,2.35,p);awning.rotation.x=.15;box(.7,1.8,.7,'#b9a084',1.1,5.6,-.8,p);rock(.07,'#e6c97c',.35,1.4,2.12,p);block(x,z,2.7,6);}
 function fence(x,z){for(let i=0;i<6;i++)box(.17,1,.17,'#997747',x+i,.5,z);for(const y of [.35,.75])box(5,.12,.13,'#ad8956',x+2.5,y,z);}
 function mushroom(x,z,s){beam([x,0,z],[x+.1,s*1.7,z],s*.15,'#f4e1b7');const cap=mesh(new T.SphereGeometry(s,7,3,0,Math.PI*2,0,Math.PI/2),'#e997a0',x+.1,s*1.6,z);cap.scale.y=.7;for(let j=0;j<4;j++)rock(s*.14,'#fff0d5',x+Math.cos(j*1.57)*s*.5,s*2.15,z+Math.sin(j*1.57)*s*.5);}
 function scatter(forest,cave){const dummy=new T.Object3D(),count=cave?130:2100;const grass=new T.InstancedMesh(cave?new T.OctahedronGeometry(.25):new T.ConeGeometry(.13,.5,3),mat(cave?'#67a0b9':'#759955'),count);for(let i=0;i<count;i++){let x=(random()-.5)*110,z=(random()-.5)*110;if(Math.abs(x-1.5*Math.sin(z*.12))<3)x+=6;dummy.position.set(x,.2,z);dummy.scale.setScalar(.5+random());dummy.rotation.y=random()*6;dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}world.add(grass);
  if(forest||cave){const points=[];for(let i=0;i<180;i++)points.push((random()-.5)*45,.5+random()*9,-random()*45);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));motes=new T.Points(geo,new T.PointsMaterial({color:cave?'#acebff':'#fff1a9',size:.065,transparent:true,opacity:.85}));world.add(motes);}}
 function village(){path('#c6baa0');[[-8,-7,'#7e9bac',.25],[8,-11,'#b96e55',-.3],[-9,-22,'#cc865b',.2],[10,-27,'#b56b50',-.25],[-9,13,'#baa36d',.3],[10,13,'#b8795b',-.3]].forEach(a=>house(...a));for(const x of [-13,6])for(const z of [-2,-17,19])fence(x,z);
  for(let i=0;i<36;i++){const a=i/36*Math.PI*2,r=25+random()*28;tree(Math.cos(a)*r,Math.sin(a)*r,.7+random()*.5);}
  box(6,.08,80,'#78bdc3',16,.02,-5);for(let i=0;i<14;i++)box(.55,.18,2.2,'#ad7b50',12.5+i*.52,.45,2);for(const z of [.9,3.1]){beam([12.5,.9,z],[19.3,.9,z],.1,'#8b613e');for(const x of [12.5,15.8,19.3])box(.16,1,.16,'#8b613e',x,.7,z);}
  for(const x of [-3.4,3.4])for(const z of [-6,-22,10]){beam([x,0,z],[x,2.7,z],.065,'#606655');const lantern=box(.35,.55,.35,'#ffe0a0',x,2.55,z);lantern.userData.lantern=true;const lamp=new T.PointLight('#ffcd83',0,12,2);lamp.position.set(x,2.7,z);lamp.userData.nightLight=true;world.add(lamp);mesh(new T.ConeGeometry(.32,.28,4),'#606655',x,2.98,z);}
  for(const z of [-4,15]){box(2.2,.16,.65,'#a4784b',-5,.6,z);box(2.2,.65,.12,'#a4784b',-5,1,z-.28);for(const x of [-5.8,-4.2])box(.12,.6,.45,'#78583e',x,.3,z);}}
 function cave(){path('#87b3c3',65);for(let i=0;i<44;i++){const a=i/44*Math.PI*2,x=Math.cos(a)*29,z=-10+Math.sin(a)*37;const wall=rock(6+random()*3,i%2?'#294f69':'#35657d',x,6,z);wall.scale.y=1.8;block(x,z,5,24);const ice=mesh(new T.ConeGeometry(.5+random()*.5,3+random()*4,5),'#7fcadd',x*.8,12+random()*4,z*.8);ice.rotation.z=Math.PI;}
  for(let i=0;i<20;i++)crystal((i%2?1:-1)*(7+random()*15),-32+random()*54,1+random(),i%3?'#6bd3e6':'#a18bec');const pool=mesh(new T.CylinderGeometry(7,7,.10,16),'#4b9fba',11,.03,-14);pool.scale.z=.8;
  for(const x of [-10,-4])box(.9,6,.9,'#729fac',x,3,-22);for(let i=0;i<7;i++){const a=Math.PI*i/6,o=box(1.1,.9,1.2,'#8eb9c0',-7+3*Math.cos(a),6+2.6*Math.sin(a),-22);o.rotation.z=a-Math.PI/2;}
  box(6,6,1.6,'#527f94',11,3.7,-29);box(3.7,5,.3,'#294d70',11,3.2,-28.1);for(const side of [-1,1])beam([11+side*2.7,6,-28],[11,9,-28],.45,'#85bdc8');for(let i=0;i<4;i++)box(6-i*.35,.28,1.1,'#8ebdca',11,.2+i*.28,-25-i*.8);for(const y of [2.2,4]){const rune=box(.8,.8,.08,'#a2ebf5',11,y,-27.88);rune.rotation.z=Math.PI/4;}
  for(const [x,z] of [[-12,-10],[13,-18],[0,-30]]){const light=new T.PointLight('#79d8ff',32,18,2);light.position.set(x,3,z);world.add(light);}}
 function enchanted(){path('#aeb58d',85);for(const [x,z,s] of [[-12,-8,1],[14,-10,1.1],[-17,-26,1.4],[20,-30,1.4],[-16,16,1.2],[18,18,1.1]])tree(x,z,s,true);for(let i=0;i<35;i++)tree((i%2?1:-1)*(24+random()*37),(random()-.6)*110,.8+random()*.5,true);
  for(const a of [[-6,-5,1.7],[-8,-11,1.1],[7,2,.9],[5,-18,1.3],[-10,8,2]])mushroom(...a);for(const a of [[8,-6,1.2,'#8ee7d8'],[-8,-18,.9,'#b8e5e8'],[16,-19,1.7,'#f0afc5'],[-12,4,.7,'#a3ddce']])crystal(...a);
  for(const x of [-10,-5])box(.55,5,.65,'#8b9b7b',x,2.5,-16);box(7,.6,1,'#9eaa85',-7.5,5.2,-16);box(5.8,.3,.65,'#738b72',-7.5,4.3,-16);
  const pool=mesh(new T.CylinderGeometry(5.8,6,.1,14),'#73c8c1',12,.03,-12);pool.scale.z=.75;for(let i=0;i<3;i++){box(6-i,2.1,4,'#699480',15,1+i*2,-19-i*2);box(5-i,.3,3,'#7faa6a',15,2.1+i*2,-19-i*2);}for(let i=0;i<2;i++){box(2.3,2.2,.16,'#9adeD9',14,1.2+i*2.1,-17-i*2.1);for(let j=0;j<4;j++)box(.07,2.1,.19,'#d9f4e6',13.1+j*.52,1.2+i*2.1,-16.95-i*2.1);for(let j=0;j<5;j++)rock(.25,'#e6f5e6',13+random()*2,.3+i*2.1,-16.8-i*2.1);}
  for(const side of [-1,1]){const tent=box(2.6,.1,3.5,'#c4966d',6+side*.85,1.1,-25);tent.rotation.z=-side*.9;}beam([6,2.2,-27],[6,2.2,-23],.07,'#745c40');for(let i=0;i<7;i++)rock(.22,'#929680',4+Math.cos(i)*.6,.15,-21+Math.sin(i)*.6);mesh(new T.ConeGeometry(.4,1,5),'#ffc26c',4,.6,-21,world,true);const fire=new T.PointLight('#ffbc6b',12,9);fire.position.set(4,1,-21);world.add(fire);}
 function rainforest(){
  path('#c7b781',100);
  for(const [x,z] of [[-6,-7],[7,-12],[-8,6],[7,-26]]){
   beam([x,0,z],[x+.5,4.3,z],.22,'#9b8558');
   for(let j=0;j<7;j++){const a=j/7*Math.PI*2,leaf=rock(1,j%2?'#4b9d68':'#7bb45b',x+.5+Math.cos(a)*1.4,4.1,z+Math.sin(a)*1.4);leaf.scale.set(.45,.18,2.1);leaf.rotation.y=Math.PI/2-a;}
   block(x,z,.45,5);
  }
  const lagoon=mesh(new T.CylinderGeometry(9,9,.12,16),'#58c7bd',14,.04,-14);lagoon.scale.z=1.6;
  for(let i=0;i<42;i++){
   const side=i%2?1:-1,x=side*(9+random()*35),z=-48+random()*95,h=7+random()*5;
   beam([x,0,z],[x+.6,h*.55,z],.32,'#8e7951');beam([x+.6,h*.55,z],[x+1.3,h,z],.24,'#8e7951');
   for(let j=0;j<7;j++){
    const a=j/7*Math.PI*2;const leaf=rock(1,'#3b9767',x+1.3+Math.cos(a)*2.2,h-.3,z+Math.sin(a)*2.2);
    leaf.scale.set(.65,.25,3.3);leaf.rotation.y=Math.PI/2-a;leaf.rotation.z=.2;
   }
   for(let j=0;j<3;j++)rock(.29,'#b6a159',x+1.3+Math.cos(j*2)*.4,h-.4,z+Math.sin(j*2)*.4);
   block(x,z,.6,h);
   if(i%3===0){tree(x+5,z+3,1.1,true);beam([x+3,h,z],[x+3,h-4,z],.035,'#4b925c');}
  }
  for(let i=0;i<8;i++){
   const stone=mesh(new T.CylinderGeometry(.75,.9,.18,7),'#a0afa0',10+i*.9,.2,-8+i*.4);stone.rotation.y=random()*3;
  }
  for(let i=0;i<16;i++)beam([9+i*.5,.55,2],[9+i*.5,.55,4.4],.15,'#d0a968');
  for(const z of [2,4.4])beam([9,1.3,z],[16.5,1.3,z],.07,'#bd945c');
  for(let i=0;i<3;i++){box(5-i,2.4,4,'#648c7b',17,1.2+i*2.4,-29-i*2);box(4-i,.3,3,'#65975c',17,2.4+i*2.4,-29-i*2);}
  box(2,6,.15,'#a4e4db',16.5,3,-27);
  for(let j=0;j<5;j++)box(.07,6,.17,'#d2f2e5',15.7+j*.35,3,-26.9);
  for(let i=0;i<90;i++){
   const x=(i%2?1:-1)*(5+random()*30),z=-40+random()*75;
   for(let j=0;j<4;j++){const leaf=rock(.7,'#54a77b',x+Math.cos(j)*.4,.5,z+Math.sin(j)*.4);leaf.scale.set(.3,1.4,.4);leaf.rotation.z=Math.cos(j)*.6;}
   if(i%3===0)for(let j=0;j<5;j++)rock(.15,'#e991ae',x+Math.cos(j*1.25)*.2,.95,z+Math.sin(j*1.25)*.2);
  }
 }
 function detail(forest,cave){
  if(cave){
   for(const side of [-1,1])for(let i=0;i<5;i++){
    crystal(side*(6+random()*6),4-i*6,.7+random()*.7,i%2?'#8bcbdc':'#a496e1');
    const ice=mesh(new T.ConeGeometry(.35,2.5+random()*2,5),'#73b8d0',side*(5+random()*8),10+random()*2,-i*7);ice.rotation.z=Math.PI;
   }
   return;
  }
  for(let i=0;i<150;i++){
   const z=-35+random()*60,side=i%2?1:-1,x=side*(4.8+random()*15);
   const shrub=rock(.5+random()*.65,forest?'#52856a':'#8ba45d',x,.35,z);shrub.scale.y=.7;
   if(i%3===0)for(let j=0;j<3;j++)rock(.10,['#f4d49c','#f1a9bb','#dfecda'][j],x+(j-1)*.24,.8,z);
   if(forest&&i%2===0)for(let j=0;j<5;j++){
    const leaf=mesh(new T.ConeGeometry(.18,.95,3),'#72ac87',x+Math.cos(j)*.25,.48,z+Math.sin(j)*.25);
    leaf.rotation.z=Math.cos(j)*.8;leaf.rotation.x=Math.sin(j)*.8;
   }
  }
 }
 function build(type){currentType=type;world.traverse(o=>{o.geometry?.dispose();if(o.isPoints)o.material.dispose();});world.clear();obstacles.length=0;motes=null;seed=88;const icy=type==='cave',forest=type==='forest'||type==='rainforest';bounds=icy?40:110;
  scene.background.set(icy?'#193c54':forest?'#b6d8c4':'#b9e0dd');scene.fog.color.copy(scene.background);scene.fog.near=icy?25:45;scene.fog.far=icy?78:130;sun.color.set(icy?'#b0deff':'#fff0ca');sun.intensity=icy?1.05:forest?2:2.8;ambient.color.set(icy?'#8bc2df':'#fff5db');ambient.groundColor.set(icy?'#294d69':'#69875b');ambient.intensity=icy?1.65:2;
  const floor=mesh(new T.PlaneGeometry(300,300),icy?'#376d87':forest?'#72986b':'#b1bd7b',0,-.02,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;if(icy)cave();else if(type==='rainforest')rainforest();else if(forest)enchanted();else village();scatter(forest,icy);detail(forest,icy);
  if(!icy)for(let i=0;i<16;i++){const a=i/16*Math.PI*2,hill=rock(18+random()*9,forest?'#558b78':'#91a66c',Math.cos(a)*85,4,Math.sin(a)*85);hill.scale.y=1.4;}world.scale.set(1.7,1,1.7);for(const o of obstacles){o.x*=1.7;o.z*=1.7;o.r*=1.7;}}
 function lighting(){const icy=currentType==='cave';scene.background.set(night?'#13283d':icy?'#193c54':(currentType==='forest'||currentType==='rainforest')?'#b6d8c4':'#b9e0dd');scene.fog.color.copy(scene.background);sun.intensity=night?.22:icy?1.05:2.8;sun.color.set(night?'#9bbbe9':'#fff0ca');ambient.intensity=night?.65:icy?1.65:2;ambient.color.set(night?'#92afd3':'#fff5db');world.traverse(o=>{if(o.userData.nightLight)o.intensity=night?18:0;if(o.userData.lantern){o.material.emissive.set(night?'#ffba62':'#000000');o.material.emissiveIntensity=night?1:0;}});}
 build('village');return {build(type){build(type);lighting();},setNight(value){night=value;lighting();},obstacles,height:()=>0,get bounds(){return bounds;},update(time){if(motes)motes.rotation.y=Math.sin(time*.06)*.035;}};
}
