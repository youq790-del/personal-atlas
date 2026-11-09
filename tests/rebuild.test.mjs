import test from 'node:test';
import assert from 'node:assert/strict';
import { createBuildPlan, cursorPoint } from '../src/studio/rebuild-model.ts';

test('a cursor cannot start a second task before its previous target has settled', () => {
  const plan = createBuildPlan(Array.from({ length: 24 }, (_, index) => ({ kind: index % 2 ? 'place' : 'type', text: '理工科在读，写笔记，做影像。' })));
  const ends = [0, 0, 0];
  for (const task of plan) {
    assert.ok(task.start >= ends[task.lane], 'same cursor was assigned overlapping tasks');
    ends[task.lane] = task.start + task.duration;
  }
  assert.equal(new Set(plan.map(task => task.index)).size, 24);
  assert.ok(plan[1].start < plan[0].duration, 'different cursors should work concurrently');
});

test('typing uses visible Unicode characters and a paragraph cannot stall the page', () => {
  const [short, long] = createBuildPlan([{ kind: 'type', text: '你好🌱' }, { kind: 'type', text: '字'.repeat(3000) }]);
  assert.equal(short.steps, 3);
  assert.ok(long.duration <= 1.25);
});

test('cursor labels stay inside small screens and invalid negative target positions', () => {
  assert.deepEqual(cursorPoint(-90, -10, 320, 600), { x: 0, y: 0 });
  assert.deepEqual(cursorPoint(500, 1000, 320, 600), { x: 228, y: 558 });
  assert.deepEqual(cursorPoint(20, 20, 40, 20), { x: 0, y: 0 });
});
