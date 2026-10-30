const assert=require('node:assert/strict');const game=require('../engine.js');
const tick=(s,seconds,input={x:0,y:0})=>{for(let i=0;i<seconds*20;i++)game.update(s,.05,input)};
let s=game.create(),start={...s.farmer};tick(s,4);assert.ok(game.distance(s.farmer,start)>.1,'caretaker moves without player input');
s=game.create();let x=s.goose.x;tick(s,1,{x:1,y:0});assert.ok(s.goose.x>x+2,'continuous movement');let normal=s.goose.x;s=game.create();tick(s,1,{x:1,y:0,run:true});assert.ok(s.goose.x>normal,'run is faster');
s=game.create();s.goose.x=3;s.goose.y=3;s.items.ribbon.x=3.5;s.items.ribbon.y=3;tick(s,.4,{x:1,y:0});assert.ok(s.items.ribbon.x>3.5,'walking pushes loose objects');
s=game.create();s.goose.x=s.farmer.x-2;s.goose.y=s.farmer.y;assert.equal(game.honk(s),true);assert.equal(s.goals.honk,true);assert.equal(s.farmer.state,'investigate');let before={...s.farmer};tick(s,.5);assert.ok(game.distance(s.farmer,before)>.2,'caretaker investigates');
s=game.create();s.farmer.x=5.5;s.farmer.y=3;s.goose.x=s.items.basket.x;s.goose.y=s.items.basket.y;assert.equal(game.interact(s),'pick');tick(s,.1);assert.equal(s.farmer.state,'chase');tick(s,2);assert.equal(s.goose.carrying,null,'caretaker catches and takes object');tick(s,6);assert.ok(game.distance(s.items.basket,s.items.basket.home)<.1,'caretaker returns object');
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
