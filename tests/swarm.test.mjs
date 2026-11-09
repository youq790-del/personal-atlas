import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceBuild,createBuildState,finishBuild,fitCursor,graphemeOffsets,revealProgress,visibleBox} from '../src/swarm/model.ts';

test('swarm reserves three independent cursor lanes and finishes visible pieces',()=>{
  const states=Array.from({length:8},()=>createBuildState('media'));
  const visible=new Set(states.map((_,index)=>index));
  advanceBuild(states,visible,.04);
  assert.equal(states.filter(state=>state.phase==='active').length,3);
  for(let i=0;i<180;i++){
    const active=states.filter(state=>state.phase==='active');
    assert.equal(new Set(active.map(state=>state.lane)).size,active.length);
    advanceBuild(states,visible,.04);
  }
  assert.ok(states.every(state=>state.phase==='done'));
});
test('scrolling releases offscreen lanes, preserving elapsed time until return',()=>{
  const states=Array.from({length:6},()=>createBuildState('text',24));
  advanceBuild(states,new Set([0,1,2]),.04);
  const before=states[0].elapsed;
  advanceBuild(states,new Set([3,4,5]),.04);
  assert.equal(states[0].elapsed,before);assert.equal(states[0].lane,-1);
  assert.equal(states[3].phase,'active');
  advanceBuild(states,new Set([0,1,2]),.04);
  assert.ok(states[0].elapsed>before);
});
test('pause freezes time, long background deltas cannot skip an entire reveal',()=>{
  const states=[createBuildState('media')],visible=new Set([0]);
  advanceBuild(states,visible,100,2);
  assert.equal(states[0].elapsed,.1);
  const snapshot=structuredClone(states);
  advanceBuild(states,visible,1,2,true);assert.deepEqual(states,snapshot);
  finishBuild(states[0]);assert.equal(revealProgress(states[0]),1);assert.equal(states[0].lane,-1);
});
test('text ranges keep emoji, Chinese and combining characters intact',()=>{
  const text='yo7好👩‍🔬é';
  const result=graphemeOffsets(text).map(({start,end})=>text.slice(start,end));
  assert.deepEqual(result,['y','o','7','好','👩‍🔬','é']);
});
test('viewport admission excludes zero-sized, offscreen and toolbar-obscured pieces',()=>{
  assert.equal(visibleBox({x:0,y:720,width:200,height:40},390,844),true);
  assert.equal(visibleBox({x:0,y:800,width:200,height:40},390,844),false);
  assert.equal(visibleBox({x:0,y:-50,width:200,height:40},390,844),false);
  assert.equal(visibleBox({x:0,y:100,width:0,height:40},390,844),false);
  assert.deepEqual(fitCursor(1000,1000,390,844),{x:306,y:739});
});
