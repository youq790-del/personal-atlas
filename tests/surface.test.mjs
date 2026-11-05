import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSurfacePoster, surfaceHeight, SURFACE_DRAG_LIMIT, SURFACE_MAX_CURVATURE } from '../src/sculpture/surface.ts';

test('saddle has opposite principal bends and a flat diagonal', () => {
  for (const a of [0, 0.15, 0.46, SURFACE_MAX_CURVATURE]) {
    for (const t of [-1, -0.4, 0, 0.4, 1]) {
      assert.equal(surfaceHeight(t, t, a), 0);
      assert.equal(surfaceHeight(t, -t, a), 0);
      assert.ok(Math.abs(surfaceHeight(t, 0, a) + surfaceHeight(0, t, a)) < Number.EPSILON);
    }
  }
});

test('curvature and local pull are bounded independently', () => {
  const drag = { x: 0.2, y: -0.1, amplitude: 100, sigma: 0.34 };
  const atCenter = surfaceHeight(drag.x, drag.y, 0, drag);
  assert.equal(atCenter, SURFACE_DRAG_LIMIT);
  const far = surfaceHeight(-1, 1, 0, drag);
  assert.ok(far < 0.001);
  assert.equal(surfaceHeight(1, 0, 99), SURFACE_MAX_CURVATURE);
  assert.equal(surfaceHeight(1, 0, -99), 0);
});

test('flat state has zero base height and preserves direct local input', () => {
  for (const [x, y] of [[-1, 0.3], [0.6, 1], [0, 0]]) {
    assert.equal(surfaceHeight(x, y, 0.46, undefined, true), 0);
  }
  assert.equal(surfaceHeight(0, 0, 0.46, { x: 0, y: 0, amplitude: -0.2, sigma: 0.34 }, true), -0.2);
});

test('fallback projection stays finite over the complete control range', () => {
  for (const amount of [0, 0.01, 0.25, 0.9, SURFACE_MAX_CURVATURE]) {
    const model = buildSurfacePoster(amount);
    assert.ok(model.outline.endsWith(' Z'));
    assert.equal(model.parameterLines.length, 34);
    assert.ok(!JSON.stringify(model).match(/NaN|Infinity|undefined/));
    const coordinates = model.outline.match(/-?\d+(?:\.\d+)?/g).map(Number);
    for (let i = 0; i < coordinates.length; i += 2) {
      assert.ok(coordinates[i] >= 0 && coordinates[i] <= 980, 'fallback x stays in the viewBox');
      assert.ok(coordinates[i + 1] >= 0 && coordinates[i + 1] <= 660, 'fallback y stays in the viewBox');
    }
    assert.deepEqual(buildSurfacePoster(amount), model);
  }
  assert.equal(buildSurfacePoster(0.46, true).contourLines.length, 0);
});
