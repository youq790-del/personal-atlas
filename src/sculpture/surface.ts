export const SURFACE_DOMAIN = 1;
export const SURFACE_MAX_CURVATURE = 1.35;
export const SURFACE_DRAG_LIMIT = 0.38;
export const SURFACE_GRID_STEPS = 84;

export type SurfaceDrag = {
  x: number;
  y: number;
  amplitude: number;
  sigma: number;
};

export type SurfacePoint = {
  x: number;
  y: number;
  z: number;
};

export const clampSurface = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function surfaceHeight(
  x: number,
  y: number,
  curvature: number,
  drag?: SurfaceDrag,
  flattened = false,
): number {
  const amount = clampSurface(curvature, 0, SURFACE_MAX_CURVATURE);
  const saddle = flattened ? 0 : amount * (x * x - y * y);
  if (!drag || Math.abs(drag.amplitude) < 0.0001) return saddle;
  const radius = Math.max(0.08, drag.sigma);
  const dx = x - drag.x;
  const dy = y - drag.y;
  const local = clampSurface(drag.amplitude, -SURFACE_DRAG_LIMIT, SURFACE_DRAG_LIMIT)
    * Math.exp(-(dx * dx + dy * dy) / (radius * radius));
  return saddle + local;
}

export function projectSurfacePoint(
  x: number,
  y: number,
  curvature: number,
  drag?: SurfaceDrag,
  flattened = false,
): SurfacePoint {
  return { x, y, z: surfaceHeight(x, y, curvature, drag, flattened) };
}

const posterProject = (point: SurfacePoint, width: number, height: number) => ({
  x: width * 0.5 + (point.x - point.y) * width * 0.24,
  y: height * 0.51 + (point.x + point.y) * height * 0.19 - point.z * height * 0.18,
});

const pathFrom = (points: Array<{ x: number; y: number }>) =>
  points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');

function contourSegments(curvature: number, flattened: boolean, width: number, height: number) {
  const output: string[] = [];
  const steps = 30;
  const range: [number, number] = [-1, 1];
  const delta = (range[1] - range[0]) / steps;
  const levels = flattened ? [] : [-1.2, -1.0, -0.8, -0.6, -0.4, -0.2, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]
    .filter(level => Math.abs(level) <= curvature + 0.015);
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0]] as const;

  for (const level of levels) {
    for (let row = 0; row < steps; row++) {
      for (let col = 0; col < steps; col++) {
        const x = -1 + col * delta, y = -1 + row * delta;
        const corners: SurfacePoint[] = [
          projectSurfacePoint(x, y, curvature, undefined, flattened),
          projectSurfacePoint(x + delta, y, curvature, undefined, flattened),
          projectSurfacePoint(x + delta, y + delta, curvature, undefined, flattened),
          projectSurfacePoint(x, y + delta, curvature, undefined, flattened),
        ];
        const crossings: Array<{ x: number; y: number }> = [];
        for (const [a, b] of edges) {
          const av = corners[a].z - level, bv = corners[b].z - level;
          if ((av < 0 && bv >= 0) || (bv < 0 && av >= 0)) {
            const t = av / (av - bv);
            const p = posterProject({
              x: corners[a].x + (corners[b].x - corners[a].x) * t,
              y: corners[a].y + (corners[b].y - corners[a].y) * t,
              z: level,
            }, width, height);
            crossings.push(p);
          }
        }
        for (let i = 0; i + 1 < crossings.length; i += 2) {
          const a = crossings[i], b = crossings[i + 1];
          output.push(`M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`);
        }
      }
    }
  }
  return output;
}

export type SurfacePosterModel = {
  outline: string;
  parameterLines: string[];
  contourLines: string[];
};

/** Deterministic projection of the same saddle equation used by the GPU shader. */
export function buildSurfacePoster(
  curvature: number,
  flattened = false,
  width = 980,
  height = 660,
): SurfacePosterModel {
  const edgeSamples = 32;
  const perimeter: SurfacePoint[] = [];
  for (let i = 0; i <= edgeSamples; i++) perimeter.push({ x: -1 + 2 * i / edgeSamples, y: -1, z: 0 });
  for (let i = 1; i <= edgeSamples; i++) perimeter.push({ x: 1, y: -1 + 2 * i / edgeSamples, z: 0 });
  for (let i = 1; i <= edgeSamples; i++) perimeter.push({ x: 1 - 2 * i / edgeSamples, y: 1, z: 0 });
  for (let i = 1; i < edgeSamples; i++) perimeter.push({ x: -1, y: 1 - 2 * i / edgeSamples, z: 0 });
  const outline = pathFrom(perimeter.map(point => posterProject({ ...point, z: surfaceHeight(point.x, point.y, curvature, undefined, flattened) }, width, height))) + ' Z';
  const parameterLines: string[] = [];
  const lineCount = 17;
  const lineSamples = 48;
  for (let i = 0; i < lineCount; i++) {
    const fixed = -0.94 + 1.88 * i / (lineCount - 1);
    const first: Array<{ x: number; y: number }> = [];
    const second: Array<{ x: number; y: number }> = [];
    for (let j = 0; j <= lineSamples; j++) {
      const varying = -1 + 2 * j / lineSamples;
      const a = projectSurfacePoint(varying, fixed, curvature, undefined, flattened);
      const b = projectSurfacePoint(fixed, varying, curvature, undefined, flattened);
      first.push(posterProject(a, width, height));
      second.push(posterProject(b, width, height));
    }
    parameterLines.push(pathFrom(first), pathFrom(second));
  }
  return { outline, parameterLines, contourLines: contourSegments(curvature, flattened, width, height) };
}
