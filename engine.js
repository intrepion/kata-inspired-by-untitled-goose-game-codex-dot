(function(root){
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const homes={basket:{x:7.4,y:3.0},ribbon:{x:6.0,y:7.1},pear:{x:8.2,y:6.6},hat:{x:7.2,y:3.5}};
  // Low hedges shelter the goose but require the caretaker to go around.
  const cover=[{x1:4.2,y1:2.5,x2:5.4,y2:3.15},{x1:5.0,y1:5.2,x2:6.1,y2:5.8},{x1:7.0,y1:7.7,x2:8.2,y2:8.3}];
  const VISION={range:2.7,near:.7,halfAngle:55*Math.PI/180,noticeTime:.6};
  const routine=[{x:7.2,y:3.5},{x:8.7,y:5.5},{x:6.2,y:7.5},{x:4.7,y:4.2}];
  function create(){return {goose:{x:2.5,y:7.5,dx:1,dy:0,carrying:null,running:false},farmer:{x:7.2,y:3.5,wearingHat:true,dx:0,dy:1,state:'working',target:null,routine:0,timer:1,notice:0,exposure:0},items:Object.fromEntries(Object.entries(homes).map(([id,p])=>[id,{id,...p,home:{...p},carried:false}])),goals:{honk:false,basket:false,hat:false,tap:false},tap:{x:8.6,y:2.0,on:false},nest:{x:1.7,y:8.4},message:'Explore the orchard. The caretaker has a routine of her own.',messageTime:5,honkCooldown:0,completed:false}}
  function say(s,text){s.message=text;s.messageTime=3}
  function near(a,b,d){return distance(a,b)<d}
  function interact(s){const g=s.goose,r=s.items.ribbon;
    if(g.carrying==='ribbon'&&near(g,s.tap,1)){g.carrying=null;r.carried=false;r.tied=true;r.x=s.tap.x;r.y=s.tap.y;s.tap.on=true;s.goals.tap=true;say(s,'The ribbon is tied to the running tap!');return 'tie'}
    if(!g.carrying&&near(g,s.tap,1)&&r.tied){r.tied=false;r.x=clamp(s.tap.x-.45,.4,9.6);r.y=s.tap.y;say(s,'You untied the ribbon.');return 'untie'}
    if(g.carrying){const item=s.items[g.carrying];item.carried=false;item.x=clamp(g.x+g.dx*.45,.4,9.6);item.y=clamp(g.y+g.dy*.45,.4,9.6);g.carrying=null;say(s,`Dropped the ${item.id}.`);check(s);return 'drop'}
    const hat=s.items.hat;if(!s.farmer.wearingHat&&!hat.carried&&!hat.heldByFarmer&&near(g,hat,1)){hat.carried=true;g.carrying='hat';say(s,'Picked up the hat.');return 'pick'}
    if(near(g,s.tap,1.0)){s.tap.on=!s.tap.on;s.goals.tap=s.tap.on||s.goals.tap;say(s,s.tap.on?'The irrigation tap is running!':'The tap is off.');return 'tap'}
    const candidates=Object.values(s.items).filter(i=>!i.carried&&!i.tied&&!i.heldByFarmer&&!(i.id==='hat'&&s.farmer.wearingHat)&&!(s.farmer.state==='return'&&s.farmer.target===i.id)&&near(g,i,1));candidates.sort((a,b)=>distance(g,a)-distance(g,b));if(candidates.length){const item=candidates[0];item.carried=true;g.carrying=item.id;say(s,`Picked up the ${item.id}.`);return 'pick'}say(s,'Get closer to an object or the tap.');return 'none'}
  function interrupt(s){for(const item of Object.values(s.items))if(item.heldByFarmer){item.heldByFarmer=false;item.x=s.farmer.x;item.y=s.farmer.y;}}
  function honk(s){if(s.honkCooldown>0)return false;s.honkCooldown=.8;say(s,'HONK!');const f=s.farmer;if(near(s.goose,f,3.5)){s.goals.honk=true;interrupt(s);const knocked=f.wearingHat;if(knocked){f.wearingHat=false;const h=s.items.hat;h.x=clamp(f.x+f.dx*.55,.4,9.6);h.y=clamp(f.y+f.dy*.55,.4,9.6);h.carried=false;}f.state='investigate';f.target={x:s.goose.x,y:s.goose.y};f.notice=2.8;say(s,knocked?'HONK! The caretaker dropped her hat!':'HONK! The caretaker heard you.')}return true}
  function segmentHits(a,b,r,pad=0){
    let lo=0,hi=1;for(const [v,d,min,max] of [[a.x,b.x-a.x,r.x1-pad,r.x2+pad],[a.y,b.y-a.y,r.y1-pad,r.y2+pad]]){if(Math.abs(d)<1e-9){if(v<min||v>max)return false;continue}let t1=(min-v)/d,t2=(max-v)/d;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return false}return true;
  }
  const visible=(a,b)=>!cover.some(r=>segmentHits(a,b,r));
  function canSee(f,p){const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy);if(d>VISION.range||!visible(f,p))return false;if(d<=VISION.near)return true;const len=Math.hypot(f.dx,f.dy)||1;return (dx*f.dx+dy*f.dy)/(d*len)>=Math.cos(VISION.halfAngle)-1e-10;}
  // Sample the actual radial boundary, adding rays around hedge corners and cone edges.
  function visionPolygon(f){const full=2*Math.PI,heading=Math.atan2(f.dy,f.dx),norm=a=>(a%full+full)%full,angles=[];for(let i=0;i<96;i++)angles.push(i*full/96);
    for(const a of [heading-VISION.halfAngle,heading+VISION.halfAngle,...cover.flatMap(r=>[[r.x1,r.y1],[r.x1,r.y2],[r.x2,r.y1],[r.x2,r.y2]].map(([x,y])=>Math.atan2(y-f.y,x-f.x)))])for(const offset of [-.00001,0,.00001])angles.push(norm(a+offset));
    angles.sort((a,b)=>a-b);return angles.map(a=>{const dx=Math.cos(a),dy=Math.sin(a),dot=dx*f.dx+dy*f.dy,forward=dot/(Math.hypot(f.dx,f.dy)||1)>=Math.cos(VISION.halfAngle)-1e-10;let max=forward?VISION.range:VISION.near;
      for(const r of cover){let lo=0,hi=max;for(const [v,d,min,big] of [[f.x,dx,r.x1,r.x2],[f.y,dy,r.y1,r.y2]]){if(Math.abs(d)<1e-9){if(v<min||v>big){lo=Infinity;break;}continue;}let t1=(min-v)/d,t2=(big-v)/d;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);}if(lo<=hi&&hi>=0)max=Math.min(max,Math.max(0,lo));}return {x:f.x+dx*max,y:f.y+dy*max};});}
  // A tiny visibility graph gives the caretaker a route around all hedge corners.
  function nextWaypoint(a,b){const pad=.18, nodes=[a,b,...cover.flatMap(r=>[{x:r.x1-pad,y:r.y1-pad},{x:r.x1-pad,y:r.y2+pad},{x:r.x2+pad,y:r.y1-pad},{x:r.x2+pad,y:r.y2+pad}])];
    const dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();dist[0]=0;
    while(done.size<nodes.length){let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(u<0||!Number.isFinite(dist[u])||u===1)break;done.add(u);for(let v=1;v<nodes.length;v++){if(done.has(v)||cover.some(r=>segmentHits(nodes[u],nodes[v],r,.05)))continue;let d=dist[u]+distance(nodes[u],nodes[v]);if(d<dist[v]){dist[v]=d;prev[v]=u}}}
    if(prev[1]<0)return null;let v=1;while(prev[v]>0)v=prev[v];return nodes[v];
  }
  function walk(entity,target,speed,dt){const d=distance(entity,target);if(d<.04)return true;const waypoint=nextWaypoint(entity,target);if(!waypoint)return false;const wd=distance(entity,waypoint),step=Math.min(wd,speed*dt);if(step>0){entity.dx=(waypoint.x-entity.x)/wd;entity.dy=(waypoint.y-entity.y)/wd;entity.x+=entity.dx*step;entity.y+=entity.dy*step;}return waypoint===target&&d<=step+.04}

  function check(s){for(const id of ['basket','hat']){const i=s.items[id];if(!i.carried&&!(id==='hat'&&s.farmer.wearingHat)&&near(i,s.nest,1.15))s.goals[id]=true}if(Object.values(s.goals).every(Boolean)&&!s.completed){s.completed=true;say(s,'All done! The orchard is yours to explore.')}}
  function update(s,dt,input={x:0,y:0}){dt=clamp(dt,0,.05);s.honkCooldown=Math.max(0,s.honkCooldown-dt);s.messageTime=Math.max(0,s.messageTime-dt);const g=s.goose;for(const i of Object.values(s.items))i.nudgeCooldown=Math.max(0,(i.nudgeCooldown||0)-dt);let m=Math.hypot(input.x,input.y);g.running=!!(m&&input.run);if(m){const speed=input.run?4.2:2.35;const dx=input.x/m,dy=input.y/m,previous={x:g.x,y:g.y};g.x=clamp(g.x+dx*speed*dt,.35,9.65);g.y=clamp(g.y+dy*speed*dt,.35,9.65);g.dx=dx;g.dy=dy;for(const i of Object.values(s.items)){if(!i.carried&&!i.tied&&!i.heldByFarmer&&!(i.id==='hat'&&s.farmer.wearingHat)&&!(s.farmer.state==='return'&&s.farmer.target===i.id)&&near(g,i,.48)&&i.nudgeCooldown<=0&&(i.x-previous.x)*dx+(i.y-previous.y)*dy>0){i.x=clamp(i.x+dx*.28,.4,9.6);i.y=clamp(i.y+dy*.28,.4,9.6);i.nudgeCooldown=.35}}}if(g.carrying){let i=s.items[g.carrying];i.x=g.x+g.dx*.4;i.y=g.y+g.dy*.4}
    const f=s.farmer;f.notice=Math.max(0,f.notice-dt);
    const seen=canSee(f,g);
    f.exposure=g.carrying&&seen?Math.min(VISION.noticeTime,(f.exposure||0)+dt):Math.max(0,(f.exposure||0)-dt*2);
    if(g.carrying&&seen&&(f.state==='chase'||f.exposure>=VISION.noticeTime)){if(f.state!=='chase')interrupt(s);f.state='chase';f.target=null;f.notice=1.4;}
    if(f.state==='chase'){if(near(f,g,.65)&&visible(f,g)){if(g.carrying){let i=s.items[g.carrying];i.carried=false;i.x=g.x;i.y=g.y;g.carrying=null;say(s,'Caught! The caretaker takes the object back.');f.state='restore';f.target=i.id}else{f.state='working';f.timer=.5}}else if(!g.carrying||distance(f,g)>4.6||f.notice<=0){f.state='working';f.timer=.5}else walk(f,g,1.9,dt)}
    else if(f.state==='investigate'){if(walk(f,f.target,1.65,dt)||f.notice<=0){f.state='working';f.timer=.5}}
    else if(f.state==='restore'){const i=s.items[f.target];if(i.carried){f.state='working';f.timer=.5}else if(walk(f,i,1.55,dt)){if(i.id==='hat'){f.wearingHat=true;f.state='working';f.timer=.8;say(s,'The caretaker put her hat back on.');}else{f.state='return';i.heldByFarmer=true;say(s,`The caretaker is returning the ${i.id}.`)}}}
    else if(f.state==='return'){const i=s.items[f.target];i.x=f.x;i.y=f.y;if(walk(f,i.home,1.25,dt)){i.x=i.home.x;i.y=i.home.y;i.heldByFarmer=false;f.state='working';f.timer=.8;say(s,`The caretaker put the ${i.id} back.`)}}
    else if(f.state==='working'){const displaced=Object.values(s.items).find(i=>!i.carried&&!i.tied&&!i.heldByFarmer&&!(i.id==='hat'&&f.wearingHat)&&(i.id==='hat'||distance(i,i.home)>1)&&distance(i,s.nest)>1.15&&canSee(f,i));if(displaced){f.state='restore';f.target=displaced.id}else if(s.tap.on&&near(f,s.tap,3)){f.state='tap';f.target=s.tap}else if(f.timer>0)f.timer-=dt;else if(walk(f,routine[f.routine],1.05,dt)){f.routine=(f.routine+1)%routine.length;f.timer=1.1}}
    const ribbon=s.items.ribbon;
    if(f.state==='tap'&&walk(f,s.tap,1.5,dt)){if(ribbon.tied){f.state='untie';f.timer=2.2;say(s,'The caretaker is untying the ribbon…');}else{s.tap.on=false;f.state='working';f.timer=1;say(s,'The caretaker turned the tap off.')}}
    else if(f.state==='untie'){if(!ribbon.tied){f.state='tap';}else if((f.timer-=dt)<=0){ribbon.tied=false;ribbon.heldByFarmer=true;f.state='turnoff';f.timer=.6;say(s,'The ribbon is untied. The caretaker is turning off the tap.');}}
    else if(f.state==='turnoff'){ribbon.x=f.x;ribbon.y=f.y;if((f.timer-=dt)<=0){s.tap.on=false;f.state='return';f.target='ribbon';say(s,'The caretaker turned off the tap and is returning the ribbon.');}}
    s.hidden=!visible(f,g);s.inSight=canSee(f,g);check(s)}
  function hint(s){const g=s.goose;if(g.carrying==='ribbon'&&near(g,s.tap,1))return 'Tie ribbon & turn tap on';if(g.carrying)return `Drop ${g.carrying}`;if(near(g,s.tap,1)&&s.items.ribbon.tied)return 'Untie ribbon';if(!s.farmer.wearingHat&&!s.items.hat.carried&&!s.items.hat.heldByFarmer&&near(g,s.items.hat,1))return 'Pick up hat';if(near(g,s.tap,1))return s.tap.on?'Turn tap off':'Turn tap on';let i=Object.values(s.items).find(i=>!i.carried&&!i.tied&&!i.heldByFarmer&&!(i.id==='hat'&&s.farmer.wearingHat)&&near(g,i,1));return i?`Pick up ${i.id}`:'Pick up / use'}
  function facing(f){const x=f.dx||0,y=f.dy||0;if(!x&&!y)return 'south';const names=['east','southeast','south','southwest','west','northwest','north','northeast'];return names[(Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8]}
  const api={create,update,interact,honk,hint,distance,cover,visible,canSee,visionPolygon,VISION,nextWaypoint,facing};if(typeof module!=='undefined')module.exports=api;else root.Orchard=api;
})(globalThis);
