const assert=require('node:assert/strict');const game=require('../engine.js');
const tick=(s,seconds,input={x:0,y:0})=>{for(let i=0;i<seconds*20;i++)game.update(s,.05,input)};
let s=game.create(),start={...s.farmer};tick(s,4);assert.ok(game.distance(s.farmer,start)>.1,'caretaker moves without player input');
s=game.create();let x=s.goose.x;tick(s,1,{x:1,y:0});assert.ok(s.goose.x>x+2,'continuous movement');let normal=s.goose.x;s=game.create();tick(s,1,{x:1,y:0,run:true});assert.ok(s.goose.x>normal,'run is faster');
s=game.create();s.goose.x=3;s.goose.y=3;s.items.ribbon.x=3.5;s.items.ribbon.y=3;tick(s,.4,{x:1,y:0});assert.ok(s.items.ribbon.x>3.5,'walking pushes loose objects');
s=game.create();s.goose.x=s.farmer.x-2;s.goose.y=s.farmer.y;assert.equal(game.honk(s),true);assert.equal(s.goals.honk,true);assert.equal(s.farmer.state,'investigate');let before={...s.farmer};tick(s,.5);assert.ok(game.distance(s.farmer,before)>.2,'caretaker investigates');
s=game.create();s.farmer.x=5.5;s.farmer.y=3;s.farmer.dx=1;s.farmer.dy=0;s.goose.x=s.items.basket.x;s.goose.y=s.items.basket.y;assert.equal(game.interact(s),'pick');tick(s,.4);assert.notEqual(s.farmer.state,'chase');tick(s,.25);assert.equal(s.farmer.state,'chase');tick(s,2);assert.equal(s.goose.carrying,null,'caretaker catches and takes object');tick(s,6);assert.ok(game.distance(s.items.basket,s.items.basket.home)<.1,'caretaker returns object');
s=game.create();s.goose.x=s.tap.x;s.goose.y=s.tap.y;assert.equal(game.interact(s),'tap');assert.equal(s.tap.on,true);tick(s,5);assert.equal(s.tap.on,false,'caretaker turns tap off');assert.equal(s.goals.tap,true);
s=game.create();for(const id of ['basket','pear']){s.goose.x=s.items[id].x;s.goose.y=s.items[id].y;assert.equal(game.interact(s),'pick');s.goose.x=s.nest.x;s.goose.y=s.nest.y;s.goose.dx=1;s.goose.dy=0;assert.equal(game.interact(s),'drop');assert.equal(s.goals[id],true)}s.goose.x=s.tap.x;s.goose.y=s.tap.y;game.interact(s);s.goose.x=s.farmer.x-1;s.goose.y=s.farmer.y;game.honk(s);tick(s,.05);assert.equal(s.completed,true,'all goals complete');
console.log('Continuous movement, run, honk, caretaker investigation/chase/return, tap and goals passed');

// Hedges are transparent to goose movement, opaque to sight, and route the caretaker around them.
s=game.create();s.farmer.x=4.8;s.farmer.y=2;s.goose.x=4.8;s.goose.y=3.65;s.goose.carrying='basket';s.items.basket.carried=true;
assert.equal(game.visible(s.farmer,s.goose),false);tick(s,.1);assert.notEqual(s.farmer.state,'chase','covered theft is not seen');
const corner=game.nextWaypoint(s.farmer,s.goose);assert.ok(corner && corner!==s.goose,'caretaker routes around hedge');assert.ok(game.visible(s.farmer,corner));
s.farmer.state='chase';s.farmer.notice=.2;tick(s,.4);assert.notEqual(s.farmer.state,'chase','chase ends after losing sight');
s=game.create();s.goose.x=4.8;s.goose.y=2.3;for(let i=0;i<12;i++)game.update(s,.05,{x:0,y:1});assert.ok(s.goose.y>3.15,'goose can slip through hedge');
console.log('Hedge cover, sight loss and caretaker routing passed');

// A loose object may be bumped, but must not move with the goose as if held.
for(const run of [false,true]){
 s=game.create();s.farmer.x=9;s.farmer.y=1;s.goose.x=3;s.goose.y=3;s.items.ribbon.x=3.5;s.items.ribbon.y=3;
 tick(s,1,{x:1,y:0,run});const bumped=s.items.ribbon.x;
 assert.ok(bumped>3.5&&bumped<=3.78+1e-9,'contact gives a small nudge');
 assert.equal(s.goose.carrying,null);assert.equal(s.items.ribbon.carried,false);
 assert.ok(s.goose.x>bumped+.48,'goose passes a loose item without dragging it');
 tick(s,.5,{x:1,y:0,run});assert.equal(s.items.ribbon.x,bumped,'loose item stays put after separation');
}
s=game.create();s.farmer.x=9;s.farmer.y=1;s.goose.x=3;s.goose.y=3;s.items.ribbon.x=2.8;s.items.ribbon.y=3;
tick(s,.1,{x:1,y:0});assert.equal(s.items.ribbon.x,2.8,'moving away does not pull a loose item');
s=game.create();s.farmer.x=9;s.farmer.y=1;s.goose.x=3;s.goose.y=3;s.items.ribbon.x=3.5;s.items.ribbon.y=3;
assert.equal(game.interact(s),'pick');tick(s,.4,{x:1,y:0});assert.equal(s.items.ribbon.carried,true);assert.ok(Math.abs(s.items.ribbon.x-s.goose.x-.4)<1e-9,'only an explicitly picked-up item follows');
assert.equal(game.interact(s),'drop');const dropped=s.items.ribbon.x;tick(s,.4,{x:-1,y:0});assert.equal(s.items.ribbon.x,dropped,'a dropped object remains behind when walking away');
console.log('Loose-object nudge, separation, pickup and drop regressions passed');

// The facing indicator tracks actual caretaker movement, and holds while idle.
s=game.create();s.farmer.x=6;s.farmer.y=2;s.farmer.state='investigate';s.farmer.target={x:8,y:2};s.farmer.notice=2;tick(s,.1);
assert.ok(s.farmer.dx>.99&&Math.abs(s.farmer.dy)<.001);assert.equal(game.facing(s.farmer),'east');
s.farmer.state='investigate';s.farmer.target={x:s.farmer.x,y:4};s.farmer.notice=2;tick(s,.1);
assert.ok(s.farmer.dy>.99&&Math.abs(s.farmer.dx)<.001);assert.equal(game.facing(s.farmer),'south');
const heading={dx:s.farmer.dx,dy:s.farmer.dy};s.farmer.state='working';s.farmer.timer=2;tick(s,.2);assert.deepEqual({dx:s.farmer.dx,dy:s.farmer.dy},heading,'idle retains last heading');
// Sight uses the facing direction and a short close-awareness radius.
s=game.create();s.farmer.x=7;s.farmer.y=4;s.farmer.dx=1;s.farmer.dy=0;s.goose.x=6;s.goose.y=4;s.goose.carrying='basket';s.items.basket.carried=true;tick(s,.65);assert.notEqual(s.farmer.state,'chase','a thief behind the caretaker stays hidden outside close awareness');
s=game.create();s.farmer.x=4.8;s.farmer.y=2;s.farmer.dx=0;s.farmer.dy=1;s.goose.x=4.8;s.goose.y=3.65;s.goose.carrying='basket';s.items.basket.carried=true;tick(s,.65);assert.equal(s.hidden,true);assert.notEqual(s.farmer.state,'chase','hedge blocks sight even when facing goose');
console.log('Caretaker facing, idle direction, blind spots and hedge occlusion passed');

// Exact cone, range and near-zone boundaries; exposure must be sustained.
s=game.create();const f=s.farmer;f.x=7;f.y=4;f.dx=1;f.dy=0;const point=(d,a)=>({x:f.x+d*Math.cos(a),y:f.y+d*Math.sin(a)});
assert.equal(game.canSee(f,point(2,0)),true,'front is visible');assert.equal(game.canSee(f,point(1,Math.PI)),false,'behind is a blind spot');
assert.equal(game.canSee(f,point(.69,Math.PI)),true,'near awareness includes behind');assert.equal(game.canSee(f,point(.71,Math.PI)),false,'behind beyond near awareness is hidden');
assert.equal(game.canSee(f,point(2,game.VISION.halfAngle)),true,'cone edge is visible');assert.equal(game.canSee(f,point(2,game.VISION.halfAngle+.01)),false,'outside cone edge is hidden');
assert.equal(game.canSee(f,point(2.7,0)),true,'range boundary is visible');assert.equal(game.canSee(f,point(2.71,0)),false,'beyond range is hidden');
const shape=game.visionPolygon(f);const east=shape.find(p=>Math.abs(p.y-f.y)<1e-9&&p.x>f.x);assert.ok(east);assert.ok(Math.abs(game.distance(f,east)-2.7)<1e-6,'visual field uses detection range');
s.goose.x=8;s.goose.y=4;s.goose.carrying='basket';s.items.basket.carried=true;tick(s,.5);assert.notEqual(f.state,'chase');assert.ok(f.exposure>0,'notice builds before pursuit');tick(s,.15);assert.equal(f.state,'chase');
f.x=4.8;f.y=2;f.dx=0;f.dy=1;f.state='chase';f.notice=.3;f.exposure=0;s.goose.x=4.8;s.goose.y=3.65;tick(s,.4);assert.notEqual(f.state,'chase','chase expires after losing sight behind a hedge');
const clipped=game.visionPolygon(f);assert.ok(clipped.length<180,'both renderers have sufficient buffer capacity');
const blocked=clipped.find(p=>Math.abs(p.x-f.x)<1e-8&&p.y>f.y);assert.ok(blocked&&blocked.y<=2.5+1e-6,'visual field stops at the hedge');
console.log('Sight angle, range, near awareness, warning and chase transitions passed');
