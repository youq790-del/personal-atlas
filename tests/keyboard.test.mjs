import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveShortcuts,createKeyInput} from '../src/scene/input.ts';
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
