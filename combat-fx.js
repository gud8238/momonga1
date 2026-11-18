import * as T from 'three';

export function createCombatFX(scene){
 const group=new T.Group();scene.add(group);
 const geometry=new T.IcosahedronGeometry(1,0),effects=[];
 let shake=0;
 function burst(position,color,power=1){
  shake=Math.max(shake,.16*power);
  for(let i=0;i<14;i++){
   const material=new T.MeshBasicMaterial({color,transparent:true});
   const mesh=new T.Mesh(geometry,material);mesh.position.copy(position);mesh.position.y+=1;
   mesh.scale.setScalar((.05+Math.random()*.1)*power);group.add(mesh);
   effects.push({mesh,life:.4+Math.random()*.2,total:.6,velocity:new T.Vector3((Math.random()-.5)*9,2+Math.random()*5,(Math.random()-.5)*9).multiplyScalar(power)});
  }
 }
 function wave(position,color,radius=6){
  const mesh=new T.Mesh(new T.RingGeometry(.85,1,48),new T.MeshBasicMaterial({color,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.position.copy(position);mesh.position.y+=.16;group.add(mesh);
  effects.push({mesh,life:.48,total:.48,radius,ownGeometry:true});shake=Math.max(shake,.2);
 }
 function slash(position,yaw){
  const mesh=new T.Mesh(new T.RingGeometry(1.15,1.55,24,1,-.9,1.8),new T.MeshBasicMaterial({color:'#fff2ad',transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}));
  mesh.rotation.set(-Math.PI/2,0,-yaw+Math.PI/2);mesh.position.copy(position);mesh.position.y+=1;group.add(mesh);
  effects.push({mesh,life:.2,total:.2,ownGeometry:true});
 }
 function remove(e){group.remove(e.mesh);e.mesh.material.dispose();if(e.ownGeometry)e.mesh.geometry.dispose();}
 return {burst,wave,slash,clear(){for(const e of effects)remove(e);effects.length=0;shake=0;},update(dt){
  shake=Math.max(0,shake-dt*1.5);
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){remove(e);effects.splice(i,1);continue;}
   e.mesh.material.opacity=e.life/e.total;
   if(e.velocity){e.velocity.y-=dt*12;e.mesh.position.addScaledVector(e.velocity,dt);e.mesh.rotation.x+=dt*8;}
   if(e.radius)e.mesh.scale.setScalar(.2+(1-e.life/e.total)*e.radius);
  }
 },cameraOffset(time){return new T.Vector3(Math.sin(time*97)*shake,Math.cos(time*83)*shake*.6,0);}};
}
