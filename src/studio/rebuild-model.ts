export type BuildKind = 'type' | 'place' | 'draw';
export type BuildItem = { kind: BuildKind; text?: string };
export type BuildTask = { index: number; lane: number; start: number; duration: number; steps: number };

/** Three independently occupied cursors, with bounded time for long paragraphs. */
export function createBuildPlan(items: BuildItem[]): BuildTask[] {
  const available = [0, .16, .32];
  return items.map((item, index) => {
    const lane = index % available.length;
    const steps = Math.max(1, Array.from(item.text || '').length);
    const duration = item.kind === 'type' ? Math.min(1.25, .35 + steps * .027) : item.kind === 'place' ? .82 : .62;
    const start = available[lane];
    available[lane] = start + duration + .22;
    return { index, lane, start, duration, steps };
  });
}

/** Keep the cursor tip and name within a section, including narrow screens. */
export function cursorPoint(x: number, y: number, width: number, height: number) {
  return {
    x: Math.max(0, Math.min(Math.max(0, width - 92), x)),
    y: Math.max(0, Math.min(Math.max(0, height - 42), y)),
  };
}
