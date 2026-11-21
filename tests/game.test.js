import test from 'node:test';
import assert from 'node:assert/strict';
import {GOAL,LOCATIONS,UPGRADES,CONTRACTS,initialState,migrateState,newlyUnlocked,unlocked,clickPower,rate,upgradeCost,permits,collect,select,purchase,completeContract,research,build} from '../dist/engine.js';

test('gathering respects location supply and spending does not reverse unlocks',()=>{
  const s=initialState();assert.equal(select(s,1),false);assert.equal(collect(s,100),100);assert.equal(unlocked(s,1),true);
  assert.equal(purchase(s,0),true);assert.equal(clickPower(s),3);assert.equal(unlocked(s,1),true);
  assert.equal(collect(s,1000),150);assert.equal(s.remaining[0],0);assert.equal(collect(s,1),0);assert.equal(select(s,1),true);
});
test('contracts spend sand once and grant permits for different specialities',()=>{
  const s=initialState();assert.equal(completeContract(s,0),false);collect(s,100);assert.equal(completeContract(s,0),true);
  assert.equal(s.sand,50);assert.equal(permits(s),1);assert.equal(completeContract(s,0),false);
  assert.equal(research(s,0),true);assert.equal(clickPower(s),16);assert.equal(permits(s),0);assert.equal(research(s,1),false);
});
test('automation and discounts are applied with rank limits',()=>{
  const s=initialState();collect(s,250);s.contracts=[0,1,2,3,4,5,6,7,8];
  assert.equal(purchase(s,1),true);assert.equal(research(s,1),true);assert.equal(rate(s),2.4);
  assert.equal(research(s,2),true);assert.equal(upgradeCost(s,0),17);assert.equal(purchase(s,0),true);
  assert.equal(purchase(s,0),false);for(let i=0;i<3;i++)assert.equal(research(s,1),true);assert.equal(research(s,1),false);
});
test('all equipment and contracts can be purchased and the game still won',()=>{
  const s=initialState();for(let i=0;i<LOCATIONS.length;i++){assert.equal(select(s,i),true);collect(s,LOCATIONS[i].supply);for(let j=0;j<UPGRADES.length;j++)purchase(s,j);for(let j=0;j<CONTRACTS.length;j++)completeContract(s,j);}
  assert.equal(s.owned.length,UPGRADES.length);assert.equal(s.contracts.length,CONTRACTS.length);assert.ok(s.sand>=GOAL);
  assert.equal(build(s),true);assert.equal(collect(s,100),0);assert.equal(build(s),false);
});
test('old saves retain progress and get the expanded seabed',()=>{
  const s=migrateState({sand:80,total:170,remaining:[80,1500,10000,100000],selected:0,owned:[0],ending:false});
  assert.equal(s.sand,80);assert.equal(s.total,170);assert.deepEqual(s.owned,[0]);assert.equal(s.remaining[0],80);assert.equal(s.remaining[3],7000000);assert.deepEqual(s.research,[0,0,0]);assert.deepEqual(s.pendingLocations,[1]);
});
test('one simulated active strategy finishes within an hour',()=>{
  const s=initialState();let seconds=0;
  while(s.sand<GOAL&&seconds<3600){for(let i=LOCATIONS.length-1;i>=0;i--)if(unlocked(s,i)&&s.remaining[i]>0){select(s,i);break;}
    for(let i=0;i<UPGRADES.length;i++)purchase(s,i);for(let i=0;i<CONTRACTS.length;i++)completeContract(s,i);
    while(permits(s)>0)if(![1,0,2].some(i=>research(s,i)))break;
    collect(s,rate(s)+(seconds<200?1:.1)*clickPower(s));seconds++;
  }
  assert.ok(s.sand>=GOAL,`did not finish in ${seconds}s`);assert.ok(seconds>=2400,`finished too quickly in ${seconds}s`);
});
test('cannot finish before goal or collect invalid amounts',()=>{const s=initialState();assert.equal(build(s),false);assert.equal(collect(s,-1),0);assert.equal(collect(s,NaN),0);assert.equal(s.sand,0);});


test('location announcements fire only for newly crossed milestones',()=>{
  assert.deepEqual(newlyUnlocked(99,100),[1]);
  assert.deepEqual(newlyUnlocked(100,599),[]);
  assert.deepEqual(newlyUnlocked(599,4000),[2,3]);
  assert.deepEqual(newlyUnlocked(4000,5000),[]);
});
test('an unacknowledged transition survives a saved game',()=>{
  const s=initialState();collect(s,100);s.pendingLocations=[1];
  const restored=migrateState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.pendingLocations,[1]);assert.equal(restored.selected,0);
  assert.equal(select(restored,restored.pendingLocations.shift()),true);
  assert.equal(restored.selected,1);assert.equal(restored.sand,100);
});
test('moving forward at each milestone leaves enough sand to finish',()=>{
  const s=initialState();let current=0;
  for(let next=1;next<LOCATIONS.length;next++){
    collect(s,LOCATIONS[next].unlock-s.total);assert.deepEqual(newlyUnlocked(LOCATIONS[next].unlock-1,s.total),[next]);
    assert.equal(select(s,next),true);current=next;
  }
  collect(s,LOCATIONS[current].supply);for(let i=0;i<UPGRADES.length;i++)purchase(s,i);for(let i=0;i<CONTRACTS.length;i++)completeContract(s,i);
  assert.equal(s.contracts.length,CONTRACTS.length);assert.equal(s.owned.length,UPGRADES.length);assert.equal(build(s),true);
});


test('a previous save behind an unlocked location gets a transition',()=>{
  const s=initialState();s.total=700;s.selected=1;s.version=2;delete s.pendingLocations;
  const restored=migrateState(s);assert.deepEqual(restored.pendingLocations,[2]);assert.equal(restored.selected,1);
});
