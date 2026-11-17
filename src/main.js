import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// © Fan-made learning demo. Character design: Chiikawa's Momonga.
// No official 3D model is included; each mesh below is procedurally built.
const canvas = document.getElementById('scene');
const status = document.getElementById('status');
const toastEl = document.getElementById('toast');
const $ = (id) => document.getElementById(id);
let toastTimeout;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2300);
}

try {
  const scene = new THREE.Scene();
  const skyDay = new THREE.Color('#d7effe');
  const skySunset = new THREE.Color('#ffdfcd');
  scene.background = skyDay.clone();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.36;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const orthoCamera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 80);
  orthoCamera.position.set(15.5, 12.0, 17.2);
  orthoCamera.lookAt(0, 1.5, 0);
  const fpCamera = new THREE.PerspectiveCamera(76, 1, 0.04, 120);
  fpCamera.position.set(0.5, 1.55, 3.5);
  fpCamera.rotation.order = 'YXZ';
  let activeCamera = orthoCamera;
  const orbit = new OrbitControls(orthoCamera, canvas);
  orbit.target.set(0, 1.55, 0);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.065;
  orbit.enablePan = false;
  orbit.minZoom = .72;
  orbit.maxZoom = 2.8;
  orbit.minPolarAngle = .24;
  orbit.maxPolarAngle = Math.PI / 2.08;
  orbit.rotateSpeed = .64;
  orbit.zoomSpeed = .75;
  const pointer = new PointerLockControls(fpCamera, canvas);
  const keys = new Set();
  const isMobile = matchMedia('(pointer:coarse)').matches;
  let mode = 'orbit';
  let evening = false;

  const mat = (hex, opts = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: .93, metalness: 0, flatShading: true, ...opts });
  const colors = {
    soil: mat('#ca9564'), soilEdge: mat('#b78355'), grass: mat('#b8e874'),
    treeTrunk: mat('#bf8b52'), leavesA: mat('#b4df4c'), leavesB: mat('#92cf46'), leavesC: mat('#ceec5a'),
    cloud: mat('#fffdfd', {flatShading: false}), white: mat('#fffafa', {flatShading: false}),
    cream: mat('#fffefa', {flatShading: false}), pink: mat('#f7a4b8', {flatShading: false}),
    ear: mat('#c9eaf3', {flatShading: false}), tail: mat('#c8e3eb', {flatShading: false}),
    tailAccent: mat('#5e7487'), dark: mat('#51434a', {flatShading: false}),
    rock: mat('#c7c9c7'), rockDark: mat('#aebabb'), yellow: mat('#ffdb61'),
    hill1: mat('#87c979'), hill2: mat('#a5dc7c'), woodTop: mat('#eec287'),
    greenDeep: mat('#6fba4e'), stem: mat('#75b858')
  };
  const sphereGeo = new THREE.SphereGeometry(1, 18, 12);
  const dodecGeo = new THREE.DodecahedronGeometry(1, 1);
  function mesh(geometry, material, parent = scene, x = 0, y = 0, z = 0, shadow = true) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function oval(parent, material, x,y,z, sx,sy,sz, segments = false) {
    const m = mesh(segments ? dodecGeo : sphereGeo, material, parent, x,y,z);
    m.scale.set(sx,sy,sz); return m;
  }
  function lineTube(parent, points, color = colors.dark, thickness = .018) {
    const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, Math.max(10, points.length * 5), thickness, 6, false), color, parent, 0,0,0, false);
  }
  function plane(parent, w, h, material, x,y,z) {
    return mesh(new THREE.PlaneGeometry(w,h), material, parent, x,y,z, false);
  }
  const hemi = new THREE.HemisphereLight('#ffffff','#b4bb8e',2.12); scene.add(hemi);
  const ambient = new THREE.AmbientLight('#ffffff',.38); scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff9e7',3.3);
  sun.position.set(-3, 11, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-15; sun.shadow.camera.right=15;
  sun.shadow.camera.top=15; sun.shadow.camera.bottom=-15;
  sun.shadow.camera.near=.5; sun.shadow.camera.far=42;
  sun.shadow.bias=-0.00018; sun.shadow.normalBias=.023;
  sun.shadow.radius=4.5; scene.add(sun);
  const fill = new THREE.DirectionalLight('#eafcff',.7);
  fill.position.set(4,6,-8); scene.add(fill);

  // Source image assets are bundled under assets/ as reference boards.
  // These small *actual scene textures* are included under assets/textures/.
  const texLoader = new THREE.TextureLoader();
  const grassTexture = texLoader.load('./assets/textures/grass-tile.svg');
  grassTexture.colorSpace = THREE.SRGBColorSpace;
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(4,3);
  const flowerTexture = texLoader.load('./assets/textures/flower-daisy.svg');
  flowerTexture.colorSpace = THREE.SRGBColorSpace;
  const groundMat = mat('#c0ec83',{map:grassTexture});
  const stage = new THREE.Group(); scene.add(stage);
  mesh(new RoundedBoxGeometry(11.55, .89, 9.15, 4, .18), colors.soil, stage, 0,-.55,0);
  mesh(new RoundedBoxGeometry(11.66, .26, 9.26, 4, .13), colors.soilEdge, stage, 0,-.12,0);
  const grassSlab = mesh(new RoundedBoxGeometry(11.74,.29,9.34,4,.13), groundMat, stage, 0,.05,0);
  const floorShadow = mesh(new THREE.CircleGeometry(7.9,48), new THREE.MeshBasicMaterial({color:'#77b4d2',transparent:true,opacity:.1,depthWrite:false}), scene, 0,-1.04,0,false);
  floorShadow.rotation.x=-Math.PI/2; floorShadow.scale.set(1.45,1.12,1);

  // Two sky boards give the miniature a theatrical, room-like corner backing.
  const backdrop = new THREE.Group(); stage.add(backdrop);
  const panelMat = mat('#82cbf2', {roughness:1,side:THREE.DoubleSide});
  const panelEdgeMat = mat('#90d2f6');
  mesh(new RoundedBoxGeometry(11.75,6.55,.18,4,.18),panelEdgeMat,backdrop,0,2.97,-4.58);
  mesh(new THREE.BoxGeometry(11.47,6.18,.03),panelMat,backdrop,0,2.99,-4.45,false);
  mesh(new RoundedBoxGeometry(.18,6.55,9.25,4,.18),panelEdgeMat,backdrop,-5.78,2.97,0);
  mesh(new THREE.BoxGeometry(.03,6.18,9.00),panelMat,backdrop,-5.65,2.99,0,false);
  function addHill(x,y,z,sx,sy,sz,material, parent=backdrop) {
    return oval(parent,material,x,y,z,sx,sy,sz,true);
  }
  addHill(-3.3,1.12,-4.23,2.35,1.65,.23,colors.hill2);
  addHill(-.8,.8,-4.21,2.9,1.32,.28,colors.hill1);
  addHill(2.4,.91,-4.2,2.55,1.4,.25,colors.hill2);
  addHill(5,.62,-4.18,1.7,1.0,.24,colors.hill1);
  addHill(-5.42,.83,-2.1,.24,1.35,2.2,colors.hill1);
  addHill(-5.4,.58,1.38,.24,1.14,2.3,colors.hill2);
  const clouds=[];
  function addCloud(parent,x,y,z,scale=1) {
    const group = new THREE.Group(); parent.add(group); group.position.set(x,y,z); group.scale.setScalar(scale);
    oval(group,colors.cloud,-.42,0,0,.47,.31,.21);
    oval(group,colors.cloud,0,.15,.02,.59,.46,.24);
    oval(group,colors.cloud,.52,0,0,.45,.32,.22);
    clouds.push(group); return group;
  }
  addCloud(backdrop,-2.85,4.85,-4.02,.86);
  addCloud(backdrop,1.92,5.12,-4.0,1.03);
  addCloud(backdrop,4.35,4.25,-4.05,.65);
  addCloud(backdrop,-5.28,4.8,1.7,.7);

  // Stable pseudo-random decor layout; no surprises on reloading the demo.
  let randSeed=20261117;
  function rnd(){randSeed = (randSeed*1664525+1013904223)>>>0; return randSeed/4294967296;}
  function range(min,max){return min+(max-min)*rnd();}
  function tree(x,z){
    const g=new THREE.Group(); g.position.set(x,.18,z); stage.add(g);
    const trunk=mesh(new THREE.CylinderGeometry(.24,.42,2.22,7),colors.treeTrunk,g,0,1.1,0);
    trunk.rotation.z=.035;
    const branch1=mesh(new THREE.CylinderGeometry(.13,.18,1.22,6),colors.treeTrunk,g,.42,2.0,.08);
    branch1.rotation.z=-.68;
    const crowns=[[-.54,2.89,-.08,.86,colors.leavesB],[.30,3.22,0,1.13,colors.leavesA],[-.2,4.02,-.12,1.22,colors.leavesC],[1.0,3.1,.05,.75,colors.leavesB],[-1.06,3.4,-.17,.83,colors.leavesA]];
    for(const [cx,cy,cz,r,m] of crowns){const c=oval(g,m,cx,cy,cz,r,r*.97,r*.89,true); c.rotation.set(range(-.2,.2),range(-1,1),range(-.12,.12));}
    return g;
  }
  tree(-3.75,-2.22);
  function bush(x,z,scale=1){
    const g=new THREE.Group();g.position.set(x,.16,z);g.scale.setScalar(scale);stage.add(g);
    for(let i=0;i<5;i++){
      let a=i/5*Math.PI*2;
      oval(g,i%2?colors.leavesB:colors.leavesA,Math.cos(a)*.45,.26+range(-.04,.13),Math.sin(a)*.35,.48,.45,.43,true);
    }
    oval(g,colors.leavesC,0,.55,0,.57,.47,.5,true);return g;
  }
  bush(3.6,-3.1,1.05); bush(4.65,-2.65,.85); bush(-3.45,-3.7,.7);
  bush(-4.7,2.42,.65); bush(4.52,2.12,.6); bush(-1.2,-3.75,.7);
  function stone(x,z,scale=1){
    const m=oval(stage,rnd()>.5?colors.rock:colors.rockDark,x,.33*scale+.16,z,.67*scale,.4*scale,.48*scale,true);
    m.rotation.y=range(0,Math.PI);return m;
  }
  stone(-4.23,1.05,1.12);stone(4.7,1.75,.65);stone(3.72,-1.34,.55);
  stone(-2.85,-3.4,.4);stone(2.55,-3.6,.37);
  function stump(x,z){
    const g=new THREE.Group();g.position.set(x,.2,z);stage.add(g);
    mesh(new THREE.CylinderGeometry(.58,.72,.88,9,1),colors.treeTrunk,g,0,.44,0);
    mesh(new THREE.CylinderGeometry(.6,.6,.09,9),colors.woodTop,g,0,.91,0);
    for(const r of [.25,.41]){
      const ring=mesh(new THREE.TorusGeometry(r,.014,5,24),mat('#dca565'),g,0,.958,0,false);
      ring.rotation.x=Math.PI/2;
    }
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      const root=mesh(new THREE.CylinderGeometry(.09,.19,.5,5),colors.treeTrunk,g,Math.cos(a)*.59,.22,Math.sin(a)*.59);
      root.rotation.z=Math.cos(a)*.45;root.rotation.x=-Math.sin(a)*.45;
    }
    return g;
  }
  stump(2.77,.85);
  function grassTuft(x,z,size=.45){
    const g=new THREE.Group();g.position.set(x,.19,z);g.scale.setScalar(size);stage.add(g);
    for(let i=0;i<3;i++){
      const blade=mesh(new THREE.ConeGeometry(.18, .77, 5),i===1?colors.leavesB:colors.greenDeep,g,(i-1)*.2,.36,0);
      blade.rotation.z=(i-1)*-.24;
      blade.rotation.x=range(-.12,.12);
    }
  }
  for(let i=0;i<48;i++){
    const x=range(-5.0,5.0),z=range(-3.84,3.82);
    if(Math.hypot(x,z-.65)<1.4 || (x>1.85&&x<3.7&&z>.05&&z<1.9)) continue;
    if(x<-3&&z<-1.0)continue;
    grassTuft(x,z,range(.24,.58));
  }
  function flower(x,z,size=1){
    const g=new THREE.Group();g.position.set(x,.2,z);g.scale.setScalar(size);stage.add(g);
    const h=range(.25,.43);
    mesh(new THREE.CylinderGeometry(.018,.03,h,5),colors.stem,g,0,h*.5,0);
    const petals=new THREE.Group();petals.position.y=h;petals.rotation.y=range(-.5,.5);g.add(petals);
    for(let i=0;i<5;i++){
      const a=2*Math.PI*i/5;
      oval(petals,colors.white,Math.cos(a)*.16,Math.sin(a)*.16,0,.14,.15,.055);
    }
    oval(petals,colors.yellow,0,0,.055,.105,.107,.062);
    const leaf=oval(g,colors.greenDeep,.1,h*.4,0,.14,.06,.05,true);leaf.rotation.z=.3;
    return g;
  }
  const flowerPositions=[[-3.8,3.1],[-3.25,3.23],[-2.88,2.95],[-4.3,.6],[-4.8,.9],[-3.2,-.25],
    [-1.35,3.15],[-.6,3.6],[.58,3.66],[1.52,3.35],[2.45,3.5],[3.37,3.4],[4.28,3.3],
    [4.55,-.9],[4.0,-.75],[3.46,-.85],[3.0,-2.55],[3.4,-2.8],[4.4,-2.4],
    [-1.15,-3.32],[-.62,-3.55],[.3,-3.5],[1.12,-3.55],[-2.5,2.44],[-4.7,-2.2]];
  flowerPositions.forEach(([x,z],i)=>flower(x,z,.65+(i%4)*.12));
  // Actual scene image texture: a handful of daisy sprites among mesh flowers.
  const sprites=[];
  [[-2.6,3.18],[1.92,-3.45],[4.75,-1.55],[-1.3,-3.84]].forEach(([x,z])=>{
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:flowerTexture,transparent:true,depthWrite:false}));
    sprite.position.set(x,.57,z);sprite.scale.set(.65,.65,1);stage.add(sprite);sprites.push(sprite);
  });
  // Tiny yellow butterflies with animated wings.
  const butterflies=[];
  function makeButterfly(x,y,z,size=1){
    const fly=new THREE.Group();stage.add(fly);fly.position.set(x,y,z);fly.scale.setScalar(size);
    const chest=oval(fly,mat('#a87745'),0,0,0,.075,.18,.07);
    const left=new THREE.Group();const right=new THREE.Group();fly.add(left,right);
    left.position.x=-.05;right.position.x=.05;
    const wingMat=mat('#ffdf50',{side:THREE.DoubleSide});
    const wingLeft=oval(left,wingMat,-.23,.14,0,.3,.35,.045);
    wingLeft.rotation.z=-.38;
    const wingRight=oval(right,wingMat,.23,.14,0,.3,.35,.045);
    wingRight.rotation.z=.38;
    oval(left,wingMat,-.15,-.14,0,.2,.25,.035);
    oval(right,wingMat,.15,-.14,0,.2,.25,.035);
    lineTube(fly,[[-.025,.13,0],[-.1,.28,0],[-.17,.31,0]],mat('#806147'),.014);
    lineTube(fly,[[.025,.13,0],[.1,.28,0],[.17,.31,0]],mat('#806147'),.014);
    butterflies.push({fly,left,right,x,y,z,offset:range(0,6.28)});return fly;
  }
  makeButterfly(2.16,3.12,-.84,.92);
  makeButterfly(-1.62,2.65,-2.88,.58);

  // The character is made of real 3D meshes, NOT a flat image billboard.
  const momonga=new THREE.Group(); momonga.position.set(.06,.2,.52);stage.add(momonga);
  const tailRig=new THREE.Group();momonga.add(tailRig);
  tailRig.position.set(-1.05,1.4,-.28);
  oval(tailRig,colors.tail,0,0,0,.78,.77,.22);
  for(let i=0;i<13;i++){
    const a=i/13*Math.PI*2;
    oval(tailRig,colors.tail,Math.cos(a)*.66,Math.sin(a)*.63,-.015,.23,.25,.22);
  }
  for(let i=0;i<8;i++){
    const a=-1.7+i*.45;
    let x=Math.cos(a)*.58,y=Math.sin(a)*.56;
    lineTube(tailRig,[[x*.87,y*.84,.205],[x*1.03,y*1.03,.22],[x*1.07,y*1.07,.15]],colors.tailAccent,.023);
  }
  const body=oval(momonga,colors.cream,0,1.0,0,.69,.84,.56);
  const head=oval(momonga,colors.white,0,1.81,.08,.8,.7,.64);
  // Ears + cool blue inners
  for(const s of [-1,1]){
    const ear=new THREE.Group();ear.position.set(s*.56,2.4,.08);ear.rotation.z=s*-.18;momonga.add(ear);
    oval(ear,colors.white,0,.09,0,.28,.34,.17);
    oval(ear,colors.ear,0,.075,.14,.171,.231,.061);
    // cheek fluff, as a scalloped silhouette
    for(let i=0;i<3;i++) oval(momonga,colors.white,s*(.69+i*.035),1.6+i*.2,.08,.24,.17,.23);
  }
  // Feet
  for(const s of [-1,1]){
    const foot=oval(momonga,colors.white,s*.35,.23,.25,.235,.16,.24);
    foot.rotation.z=s*.15;
    const arm=oval(momonga,colors.white,s*.54,1.09,.35,.17,.31,.18);
    arm.rotation.z=s*-.48;
    lineTube(momonga,[[s*.4,1.2,.51],[s*.51,1.31,.51],[s*.59,1.25,.48]],colors.dark,.016);
  }
  // Eyes, pupils, blush and tiny cheek lashes
  const face=new THREE.Group();momonga.add(face);
  for(const s of [-1,1]){
    oval(face,colors.dark,s*.285,1.90,.705,.128,.168,.05);
    oval(face,colors.white,s*.284-.027,1.97,.752,.047,.058,.014);
    oval(face,colors.white,s*.284+.037,1.86,.757,.026,.032,.012);
    const cheek=oval(face,colors.pink,s*.51,1.64,.625,.18,.116,.05);
    cheek.rotation.z=s*-.1;
    for(let k=0;k<2;k++){
      const x=s*(.47+k*.08);
      lineTube(face,[[x-.015,1.69,.676],[x+.014,1.61,.675]],colors.dark,.011);
    }
    oval(face,mat('#b9ddec'),s*.09,2.18,.681,.035,.027,.025);
  }
  oval(face,mat('#a4c9d9', {flatShading:false}),0,1.72,.757,.085,.061,.036);
  // Cute omega-style mouth and small tongue.
  lineTube(face,[[-.14,1.62,.738],[-.11,1.55,.763],[-.034,1.53,.771],[0,1.59,.775],[.034,1.53,.771],[.11,1.55,.763],[.14,1.62,.738]],colors.dark,.026);
  oval(face,mat('#f29bb1'),0,1.485,.758,.065,.053,.018);
  // Tiny eyelashes near outside eye corners.
  lineTube(face,[[-.415,1.98,.646],[-.46,2.03,.627]],colors.dark,.016);
  lineTube(face,[[.415,1.98,.646],[.46,2.03,.627]],colors.dark,.016);
  // Quiet little shadow so it appears rooted on the grassy platform.
  const charShadow=mesh(new THREE.CircleGeometry(.9,32),new THREE.MeshBasicMaterial({color:'#507d47',transparent:true,opacity:.16,depthWrite:false}),stage,.07,.206,.53,false);
  charShadow.rotation.x=-Math.PI/2;charShadow.scale.y=.7;

  // Helpers to make the meadow pleasant from the opposite camera angles too.
  const detailGeo = new THREE.IcosahedronGeometry(1,0);
  for(let i=0;i<46;i++){
    const x=range(-5.27,5.27),z=range(-3.9,3.9);
    if(Math.hypot(x,z-.5)<1.25 || (x<-2.5&&z<-1.4) || (x>2&&x<3.5&&z>.1&&z<1.7))continue;
    const pebble=mesh(detailGeo,i%2?colors.leavesC:colors.leavesA,stage,x,.205,z,false);
    pebble.scale.set(range(.025,.08),range(.02,.045),range(.025,.07));
  }

  function resize(){
    const w=window.innerWidth,h=window.innerHeight;
    renderer.setSize(w,h,false);
    const aspect=w/h;
    const halfHeight = aspect < .72 ? 6.7 / aspect : (w < 900 ? 7.8 : 7.0);
    orthoCamera.left=-halfHeight*aspect;
    orthoCamera.right=halfHeight*aspect;
    orthoCamera.top=halfHeight;orthoCamera.bottom=-halfHeight;
    orthoCamera.updateProjectionMatrix();
    fpCamera.aspect=aspect;fpCamera.updateProjectionMatrix();
  }
  window.addEventListener('resize',resize);resize();

  function markMode(){
    $('orbitBtn').classList.toggle('selected',mode==='orbit');
    $('walkBtn').classList.toggle('selected',mode==='walk');
    $('modeGuide').hidden=mode!=='orbit';
    $('walkGuide').hidden=mode!=='walk';
    $('mobilePad').hidden=!(mode==='walk' && isMobile);
    status.textContent = mode==='orbit'?'아이소메트릭 · 360° 자유 관람':'1인칭 산책 · WASD 이동';
  }
  function switchMode(next){
    if(next===mode){ if(next==='walk'&&!isMobile&&!pointer.isLocked)pointer.lock(); return; }
    if(pointer.isLocked)pointer.unlock();
    mode=next;keys.clear();
    if(next==='walk'){
      activeCamera=fpCamera;orbit.enabled=false;backdrop.visible=false;
      fpCamera.position.set(.6,1.55,3.65);
      fpCamera.rotation.set(0,0,0);
      fpCamera.lookAt(.1,1.52,.4);
      if(!isMobile) pointer.lock();
      toast(isMobile?'오른쪽 화면을 드래그해 둘러보세요':'WASD로 걷고 마우스로 시선을 돌려보세요');
    }else{
      activeCamera=orthoCamera;orbit.enabled=true;backdrop.visible=true;
      toast('디오라마를 드래그해서 둘러보세요 ♡');
    }
    markMode();
  }
  $('orbitBtn').addEventListener('click',()=>switchMode('orbit'));
  $('walkBtn').addEventListener('click',()=>switchMode('walk'));
  let t=0;
  let hopStart=-10;
  function hop(){hopStart=t; toast('모몽가가 통통! ♡');}
  $('jumpBtn').addEventListener('click',hop);
  function setEvening(next){
    evening=next;scene.background.copy(evening?skySunset:skyDay);
    sun.color.set(evening?'#ffbf83':'#fff9e7');sun.intensity=evening?2.6:3.3;
    hemi.intensity=evening?1.6:2.12;
    panelMat.color.set(evening?'#f5bba8':'#82cbf2');
    panelEdgeMat.color.set(evening?'#efc0be':'#90d2f6');
    $('dayBtn').querySelector('span').textContent=evening?'맑은 낮으로':'노을 전환';
    toast(evening?'따뜻한 노을이 찾아왔어요 ☀':'다시 맑은 낮이에요 ☁');
  }
  $('dayBtn').addEventListener('click',()=>setEvening(!evening));
  function reset(){
    if(mode!=='orbit')switchMode('orbit');
    orthoCamera.position.set(15.5,12,17.2);
    orbit.target.set(0,1.55,0);orthoCamera.zoom=1;orthoCamera.updateProjectionMatrix();orbit.update();
    if(evening)setEvening(false);
    toast('처음 시점으로 돌아왔어요');
  }
  $('resetBtn').addEventListener('click',reset);
  $('shotBtn').addEventListener('click',()=>{
    renderer.render(scene,activeCamera);
    const a=document.createElement('a');a.download='momonga-meadow.png';a.href=renderer.domElement.toDataURL('image/png');a.click();
    toast('현재 장면을 이미지로 저장했어요');
  });
  const dialog=$('assetDialog');
  $('referenceBtn').addEventListener('click',()=>dialog.showModal());
  $('closeAssetBtn').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',(e)=>{if(e.target===dialog)dialog.close();});
  const raycaster=new THREE.Raycaster(),pointerPos=new THREE.Vector2();
  let downTime=0,downX=0,downY=0;
  canvas.addEventListener('pointerdown',e=>{
    downTime=performance.now();downX=e.clientX;downY=e.clientY;
  });
  canvas.addEventListener('pointerup',e=>{
    if(mode==='walk'){
      if(!isMobile&&!pointer.isLocked)pointer.lock();return;
    }
    if(Math.hypot(e.clientX-downX,e.clientY-downY)>9 || performance.now()-downTime>450)return;
    const box=canvas.getBoundingClientRect();
    pointerPos.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);
    raycaster.setFromCamera(pointerPos,orthoCamera);
    if(raycaster.intersectObjects(momonga.children,true).length)hop();
  });
  window.addEventListener('keydown',e=>{
    if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if(e.repeat)return;
    if(e.code==='KeyF')switchMode(mode==='orbit'?'walk':'orbit');
    if(e.code==='KeyR')reset();
    if(e.code==='KeyJ'||e.code==='Space')hop();
    if(e.code==='KeyT')setEvening(!evening);
    if(e.code==='KeyP')$('shotBtn').click();
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',()=>keys.clear());
  if(isMobile){
    const pads=document.querySelectorAll('[data-move]');
    pads.forEach(btn=>{
      const code=btn.dataset.move;
      btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);keys.add(code);});
      for(const evt of ['pointerup','pointercancel','lostpointercapture'])
        btn.addEventListener(evt,()=>keys.delete(code));
    });
    let touchLook=null;
    canvas.addEventListener('pointerdown',e=>{
      if(mode==='walk')touchLook={id:e.pointerId,x:e.clientX,y:e.clientY};
    });
    canvas.addEventListener('pointermove',e=>{
      if(mode!=='walk'||!touchLook||touchLook.id!==e.pointerId)return;
      const dx=e.clientX-touchLook.x,dy=e.clientY-touchLook.y;
      fpCamera.rotation.y-=dx*.0045;
      fpCamera.rotation.x=THREE.MathUtils.clamp(fpCamera.rotation.x-dy*.0045,-1.25,1.25);
      touchLook.x=e.clientX;touchLook.y=e.clientY;
    });
    canvas.addEventListener('pointerup',e=>{if(touchLook?.id===e.pointerId)touchLook=null;});
    canvas.addEventListener('pointercancel',()=>touchLook=null);
  }
  const clock=new THREE.Clock();
  function animate(){
    const dt=Math.min(clock.getDelta(),.055);t+=dt;
    const hopElapsed=t-hopStart;
    const bouncing=(hopElapsed>=0&&hopElapsed<.72)?Math.sin(Math.PI*hopElapsed/.72)*.76:0;
    momonga.position.y=.2+Math.sin(t*2.1)*.06+bouncing;
    momonga.rotation.y=Math.sin(t*1.05)*.11;
    momonga.rotation.z=Math.sin(t*1.65)*.045+(bouncing?Math.sin(hopElapsed/.72*Math.PI*2)*.12:0);
    tailRig.rotation.z=Math.sin(t*2.6)*.10;
    charShadow.material.opacity=.14-bouncing*.095;
    charShadow.scale.set(1+bouncing*.1,.7+bouncing*.08,1);
    butterflies.forEach(({fly,left,right,x,y,z,offset},i)=>{
      fly.position.set(x+Math.sin(t*.64+offset)*.28,y+Math.sin(t*1.17+offset)*.22,z+Math.cos(t*.84+offset)*.19);
      fly.rotation.y=Math.sin(t*.85+offset)*.4;
      left.rotation.y=Math.sin(t*12+offset)*.9;
      right.rotation.y=-Math.sin(t*12+offset)*.9;
    });
    clouds.forEach((c,i)=>{c.position.x+=Math.sin(t*.15+i)*.000045;});
    if(mode==='orbit')orbit.update();
    else{
      const moveForward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
      const moveRight=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
      if(moveForward||moveRight){
        const v=new THREE.Vector3(moveRight,0,-moveForward).normalize().applyEuler(new THREE.Euler(0,fpCamera.rotation.y,0,'YXZ'));
        fpCamera.position.addScaledVector(v,dt*2.55);
        fpCamera.position.x=THREE.MathUtils.clamp(fpCamera.position.x,-5,5);
        fpCamera.position.z=THREE.MathUtils.clamp(fpCamera.position.z,-3.95,3.95);
      }
      fpCamera.position.y=1.55+Math.sin(t*11)*.012*(moveForward||moveRight?1:0);
    }
    renderer.render(scene,activeCamera);
    requestAnimationFrame(animate);
  }
  markMode();
  status.textContent='아이소메트릭 · 360° 자유 관람';
  animate();
  toast('작은 들판에 오신 걸 환영해요 ✿');
} catch(err){
  console.error(err);
  $('fatal').hidden=false;
  $('fatalDetail').textContent=String(err?.stack||err);
}