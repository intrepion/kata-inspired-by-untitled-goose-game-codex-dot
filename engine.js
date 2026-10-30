(function(root){
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const homes={basket:{x:7.4,y:3.0},ribbon:{x:6.0,y:7.1},pear:{x:8.2,y:6.6}};
  const routine=[{x:7.2,y:3.5},{x:8.7,y:5.5},{x:6.2,y:7.5},{x:4.7,y:4.2}];
  function create(){return {goose:{x:2.5,y:7.5,dx:1,dy:0,carrying:null},farmer:{x:7.2,y:3.5,state:'working',target:null,routine:0,timer:1,notice:0},items:Object.fromEntries(Object.entries(homes).map(([id,p])=>[id,{id,...p,home:{...p},carried:false}])),goals:{honk:false,basket:false,pear:false,tap:false},tap:{x:8.6,y:2.0,on:false},nest:{x:1.7,y:8.4},message:'Explore the orchard. The caretaker has a routine of her own.',messageTime:5,honkCooldown:0,completed:false}}
  function say(s,text){s.message=text;s.messageTime=3}
  function near(a,b,d){return distance(a,b)<d}
  function interact(s){const g=s.goose;if(g.carrying){const item=s.items[g.carrying];item.carried=false;item.x=clamp(g.x+g.dx*.45,.4,9.6);item.y=clamp(g.y+g.dy*.45,.4,9.6);g.carrying=null;say(s,`Dropped the ${item.id}.`);check(s);return 'drop'}
    if(near(g,s.tap,1.0)){s.tap.on=!s.tap.on;s.goals.tap=s.tap.on||s.goals.tap;say(s,s.tap.on?'The irrigation tap is running!':'The tap is off.');return 'tap'}
    const candidates=Object.values(s.items).filter(i=>!i.carried&&!(s.farmer.state==='return'&&s.farmer.target===i.id)&&near(g,i,1));candidates.sort((a,b)=>distance(g,a)-distance(g,b));if(candidates.length){const item=candidates[0];item.carried=true;g.carrying=item.id;say(s,`Picked up the ${item.id}.`);return 'pick'}say(s,'Get closer to an object or the tap.');return 'none'}
  function honk(s){if(s.honkCooldown>0)return false;s.honkCooldown=.8;say(s,'HONK!');const f=s.farmer;if(near(s.goose,f,3.5)){s.goals.honk=true;f.state='investigate';f.target={x:s.goose.x,y:s.goose.y};f.notice=2.8;say(s,'HONK! The caretaker heard you.')}return true}
  function walk(entity,target,speed,dt){const d=distance(entity,target);if(d<.04)return true;const step=Math.min(d,speed*dt);entity.x+=((target.x-entity.x)/d)*step;entity.y+=((target.y-entity.y)/d)*step;return d<=step+.04}
  function check(s){for(const id of ['basket','pear']){const i=s.items[id];if(!i.carried&&near(i,s.nest,1.15))s.goals[id]=true}if(Object.values(s.goals).every(Boolean)&&!s.completed){s.completed=true;say(s,'All done! The orchard is yours to explore.')}}
  function update(s,dt,input={x:0,y:0}){dt=clamp(dt,0,.05);s.honkCooldown=Math.max(0,s.honkCooldown-dt);s.messageTime=Math.max(0,s.messageTime-dt);const g=s.goose;let m=Math.hypot(input.x,input.y);if(m){const speed=input.run?3.5:2.35;const dx=input.x/m,dy=input.y/m;g.x=clamp(g.x+dx*speed*dt,.35,9.65);g.y=clamp(g.y+dy*speed*dt,.35,9.65);g.dx=dx;g.dy=dy;for(const i of Object.values(s.items)){if(!i.carried&&!(s.farmer.state==='return'&&s.farmer.target===i.id)&&near(g,i,.48)){i.x=clamp(i.x+dx*speed*dt,.4,9.6);i.y=clamp(i.y+dy*speed*dt,.4,9.6)}}}if(g.carrying){let i=s.items[g.carrying];i.x=g.x+g.dx*.4;i.y=g.y+g.dy*.4}
    const f=s.farmer;f.notice=Math.max(0,f.notice-dt);
    if(g.carrying&&near(f,g,2.7)){f.state='chase';f.target=null;f.notice=2}
    if(f.state==='chase'){if(near(f,g,.65)){if(g.carrying){let i=s.items[g.carrying];i.carried=false;i.x=g.x;i.y=g.y;g.carrying=null;say(s,'Caught! The caretaker takes the object back.');f.state='restore';f.target=i.id}else{f.state='working';f.timer=.5}}else if(!g.carrying||distance(f,g)>4.6){f.state='working';f.timer=.5}else walk(f,g,1.9,dt)}
    else if(f.state==='investigate'){if(walk(f,f.target,1.65,dt)||f.notice<=0){f.state='working';f.timer=.5}}
    else if(f.state==='restore'){const i=s.items[f.target];if(i.carried){f.state='chase'}else if(walk(f,i,1.55,dt)){f.state='return';say(s,`The caretaker is returning the ${i.id}.`)}}
    else if(f.state==='return'){const i=s.items[f.target];i.x=f.x;i.y=f.y;if(walk(f,i.home,1.25,dt)){i.x=i.home.x;i.y=i.home.y;f.state='working';f.timer=.8;say(s,`The caretaker put the ${i.id} back.`)}}
    else if(f.state==='working'){const displaced=Object.values(s.items).find(i=>!i.carried&&distance(i,i.home)>1&&distance(i,s.nest)>1.15&&near(f,i,3));if(displaced){f.state='restore';f.target=displaced.id}else if(s.tap.on&&near(f,s.tap,3)){f.state='tap';f.target=s.tap}else if(f.timer>0)f.timer-=dt;else if(walk(f,routine[f.routine],1.05,dt)){f.routine=(f.routine+1)%routine.length;f.timer=1.1}}
    if(f.state==='tap'&&walk(f,s.tap,1.5,dt)){s.tap.on=false;f.state='working';f.timer=1;say(s,'The caretaker turned the tap off.')}
    check(s)}
  function hint(s){const g=s.goose;if(g.carrying)return `Drop ${g.carrying}`;if(near(g,s.tap,1))return s.tap.on?'Turn tap off':'Turn tap on';let i=Object.values(s.items).find(i=>!i.carried&&near(g,i,1));return i?`Pick up ${i.id}`:'Pick up / use'}
  const api={create,update,interact,honk,hint,distance};if(typeof module!=='undefined')module.exports=api;else root.Orchard=api;
})(globalThis);
