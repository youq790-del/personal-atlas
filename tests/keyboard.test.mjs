import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveShortcuts,createKeyInput} from '../src/scene/input.ts';
import {resolveKeyboardSection,isSkillsSection,isReadingSection} from '../src/scene/sections.ts';
test('custom shortcuts reserve their keys before automatic assignments',()=>{
  const codes=resolveShortcuts([{shortcut:'KeyX'},{},{}],3);
  assert.equal(codes[0],'KeyX');
  assert.equal(new Set(codes).size,3);
  assert.deepEqual(resolveShortcuts([{}, {}, {}],3),['KeyZ','KeyX','KeyC']);
});
test('a key remains pressed until both hover and physical input release',()=>{
  const key={nodeId:'key',skill:{shortcut:'KeyQ'}};
  const input=createKeyInput([key],1),changes=[];
  input.subscribe((key,pressed)=>changes.push(pressed));
  input.press('hover','key');input.press('keyboard','key');input.release('hover');
  assert.deepEqual(changes,[true]);
  input.release('keyboard');assert.deepEqual(changes,[true,false]);
});

test('keyboard section follows reordered document chapters rather than the old experience-first order',()=>{
  const layout=[['hero',0],['discovery',1000],['skills',1400],['projects',3000],['writing',4300],['experience',5600],['contact',6500]];
  const resolveAt=scroll=>resolveKeyboardSection(layout.map(([id,top])=>({id,top:top-scroll})),1000,{top:1400-scroll,bottom:3000-scroll});
  for(const [scroll,expected] of [[0,'hero'],[600,'discovery'],[1000,'skills'],[2200,'skills'],[2500,'projects'],[4000,'writing'],[5300,'experience'],[6200,'contact'],[1000,'skills'],[0,'hero']]){
    assert.equal(resolveAt(scroll),expected,'scrollY='+scroll);
  }
});

test('only skills bounds can activate the keyboard, including exact boundaries and missing anchors',()=>{
  const anchors=[{id:'hero',top:-800},{id:'discovery',top:200},{id:'skills',top:500},{id:'projects',top:2100}];
  assert.equal(resolveKeyboardSection(anchors,1000,{top:501,bottom:2100}),'discovery');
  assert.equal(resolveKeyboardSection(anchors,1000,{top:500,bottom:2100}),'skills');
  assert.equal(resolveKeyboardSection([{id:'skills',top:-1100},{id:'projects',top:500}],1000,{top:-1100,bottom:500}),'projects');
  assert.equal(resolveKeyboardSection([{id:'skills',top:0}],1000),'hero');
  assert.equal(resolveKeyboardSection([],1000),'hero');
  for(const id of ['hero','discovery','projects','writing','experience','contact']){
    assert.equal(isSkillsSection(id),false);
    assert.equal(isReadingSection(id),true);
  }
  assert.equal(isSkillsSection('skills'),true);
  assert.equal(isReadingSection('skills'),false);
});

test('leaving the stage releases every held input and later re-entry accepts the same key',()=>{
  const key={nodeId:'key',skill:{shortcut:'KeyQ'}};
  const input=createKeyInput([key],1),changes=[];
  input.subscribe((key,pressed)=>changes.push(pressed));
  input.press('pointer:1','key');input.press('key:KeyQ','key');
  input.releaseAll();
  assert.deepEqual(changes,[true,false]);
  assert.equal(input.press('key:KeyQ','key'),true);
  input.release('key:KeyQ');
  assert.deepEqual(changes,[true,false,true,false]);
});
