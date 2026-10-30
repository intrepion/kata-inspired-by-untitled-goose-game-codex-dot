import * as THREE from './vendor/three/three.module.min.js';

// World positions remain owned by Orchard; the scene only displays that state.
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(960, 650, false);
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dcebc4');
  scene.add(new THREE.HemisphereLight('#fff9e2', '#668765', 2.2));
  const camera = new THREE.OrthographicCamera(-8.5, 8.5, 5.75, -5.75, .1, 100);
  const material = color => new THREE.MeshLambertMaterial({ color });
  function mesh(geometry, color, x, y, z, parent = scene) {
    const m = new THREE.Mesh(geometry, material(color)); m.position.set(x, y, z); parent.add(m); return m;
  }
  const box = (w,h,d,color,x,y,z,parent) => mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);
  const ball = (sx,sy,sz,color,x,y,z,parent) => { const m=mesh(new THREE.SphereGeometry(1,16,10),color,x,y,z,parent);m.scale.set(sx,sy,sz);return m; };
  box(10,.16,10,'#a8cf88',5,-.08,5);
  box(1.4,.06,1.1,'#c9a767',1.7,.03,8.4);
  for (const [x,z] of [[2,2],[4,1],[9.2,8.5],[3.5,6],[5.4,8.9]]) {
    box(.22,1.1,.22,'#805a38',x,.55,z);
    ball(.72,.65,.72,'#5b935f',x,1.45,z);
    ball(.5,.48,.5,'#80b879',x-.35,1.48,z+.2);
  }
  for (const r of Orchard.cover) { const x=(r.x1+r.x2)/2,z=(r.y1+r.y2)/2; box(r.x2-r.x1,.55,r.y2-r.y1,'#4f8959',x,.28,z); }
  const visionGeometry=new THREE.BufferGeometry();visionGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(180*9),3));
  const vision=new THREE.Mesh(visionGeometry,new THREE.MeshBasicMaterial({color:'#ffec97',transparent:true,opacity:.30,depthWrite:false,side:THREE.DoubleSide}));vision.frustumCulled=false;scene.add(vision);
  const goose = new THREE.Group(); scene.add(goose);
  ball(.48,.3,.32,'#faf8e9',0,.4,0,goose);
  box(.13,.48,.13,'#faf8e9',.32,.7,0,goose);
  ball(.18,.16,.16,'#faf8e9',.36,.96,0,goose);
  box(.22,.08,.12,'#dc9c4b',.55,.95,0,goose);
  const feet=[-.17,.17].map(z=>box(.1,.16,.1,'#d59849',-.12,.1,z,goose));
  const farmer = new THREE.Group(); scene.add(farmer);
  box(.38,.65,.25,'#688d9b',0,.72,0,farmer);
  ball(.22,.24,.2,'#d7aa87',0,1.17,0,farmer);
  const wornHat=box(.55,.09,.45,'#ab7953',0,1.37,0,farmer);
  for (const x of [-.13,.13]) box(.12,.4,.14,'#604d43',x,.2,0,farmer);
  // A raised arrow remains readable as the camera turns; its orientation is world-relative.
  const arrow = new THREE.Group(); farmer.add(arrow);arrow.position.y=1.75;
  box(.45,.07,.08,'#fff9d8',.28,0,0,arrow);
  const arrowTip=mesh(new THREE.ConeGeometry(.17,.32,3),'#fff9d8',.59,0,0,arrow);arrowTip.rotation.z=-Math.PI/2;
  const items = {};
  items.basket = box(.45,.25,.35,'#af7442',0,.15,0);
  items.pear = ball(.17,.22,.17,'#d9c753',0,.22,0);
  items.ribbon = box(.5,.09,.13,'#d96b75',0,.08,0);
  items.hat = box(.48,.12,.35,'#ab7953',0,.08,0);
  const tap = new THREE.Group(); scene.add(tap); tap.position.set(8.6,0,2);
  box(.13,.8,.13,'#638e8e',0,.4,0,tap); box(.38,.13,.13,'#638e8e',.15,.8,0,tap);
  const water = box(.08,.48,.08,'#84c9d0',.31,.52,0,tap);
  let angle = Math.PI/4;
  function rotate(delta) { angle += delta * Math.PI/2; }
  function draw(state) {
    camera.position.set(5+Math.sin(angle)*15,14,5+Math.cos(angle)*15);camera.lookAt(5,0,5);camera.updateProjectionMatrix();
    const polygon=Orchard.visionPolygon(state.farmer),positions=visionGeometry.attributes.position;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],base=i*3;positions.setXYZ(base,state.farmer.x,.025,state.farmer.y);positions.setXYZ(base+1,a.x,.025,a.y);positions.setXYZ(base+2,b.x,.025,b.y);}positions.needsUpdate=true;visionGeometry.setDrawRange(0,polygon.length*3);
    goose.position.set(state.goose.x,0,state.goose.y);
    goose.rotation.y = -Math.atan2(state.goose.dy,state.goose.dx);
    farmer.position.set(state.farmer.x,0,state.farmer.y);
    farmer.rotation.y=-Math.atan2(state.farmer.dy,state.farmer.dx);wornHat.visible=state.farmer.wearingHat;
    feet.forEach((foot,i)=>{foot.position.x=-.12+(state.goose.running?Math.sin(performance.now()/65+i*Math.PI)*.12:0);});
    for (const [id,obj] of Object.entries(items)) { const item=state.items[id];obj.visible=!(id==='hat'&&state.farmer.wearingHat);obj.position.set(item.x,item.tied?.55:item.carried?.75:(id==='pear'?.22:id==='basket'?.15:.08),item.y); }
    water.visible=state.tap.on;
    renderer.render(scene,camera);
  }
  return { draw, rotate };
}
