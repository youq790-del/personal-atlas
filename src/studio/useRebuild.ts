import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { createBuildPlan, cursorPoint, type BuildKind } from './rebuild-model';

gsap.registerPlugin(useGSAP);

type Options = {
  reduced: boolean;
  paused: boolean;
  replay: number;
  skip: boolean;
  onProgress: (completed: number, total: number) => void;
};
type Section = {
  element: HTMLElement;
  targets: HTMLElement[];
  cursors: HTMLElement[];
  timeline?: gsap.core.Timeline;
  started: boolean;
  visible: boolean;
  done: boolean;
};
type Controls = { sync: () => void; finish: () => void };
const ownProperties = ['transform', 'opacity', 'clip-path', 'transform-origin'] as const;

/** Reconstruct the existing DOM: no screenshots, fabricated collaborators or duplicate content. */
export function useRebuild(root: RefObject<HTMLElement | null>, options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const controls = useRef<Controls | null>(null);

  useGSAP((_context, contextSafe) => {
    const host = root.current;
    if (!host) return;
    let disposed = false;
    let lastReport = '';
    let finishedAll = latest.current.skip || latest.current.reduced;
    const completed = new Set<HTMLElement>();
    const snapshots = new Map<HTMLElement, Map<string, [string, string]>>();
    const measureText = new Map<HTMLElement, string | null>();
    const sections: Section[] = Array.from(host.querySelectorAll<HTMLElement>('[data-build-section]')).map(element => ({
      element,
      targets: [],
      cursors: Array.from(element.querySelectorAll<HTMLElement>('[data-build-cursor]')).filter(cursor => cursor.closest('[data-build-section]') === element),
      started: false,
      visible: false,
      done: false,
    }));

    const save = (element: HTMLElement) => {
      if (snapshots.has(element)) return;
      snapshots.set(element, new Map(ownProperties.map(property => [property, [element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]])));
    };
    const restoreOwn = (element: HTMLElement) => {
      snapshots.get(element)?.forEach(([value, priority], property) => {
        if (value) element.style.setProperty(property, value, priority);
        else element.style.removeProperty(property);
      });
      element.classList.remove('is-building');
    };
    const restore = (element: HTMLElement) => {
      restoreOwn(element);
      element.querySelectorAll<HTMLElement>('[data-build-glyph]').forEach(restoreOwn);
    };
    const report = () => {
      if (disposed) return;
      const targets = sections.flatMap(section => section.targets).filter(element => element.isConnected);
      const count = targets.filter(element => completed.has(element)).length;
      const signature = `${count}/${targets.length}`;
      if (signature === lastReport) return;
      lastReport = signature;
      latest.current.onProgress(count, targets.length);
    };
    const measure = (element: HTMLElement) => {
      // Width/height in the layout, independent of the temporary drag transform.
      const width = element.offsetWidth, height = element.offsetHeight;
      if (!width || !height || element.closest('[hidden]')) return;
      element.querySelectorAll<HTMLElement>('[data-measure]').forEach(label => {
        if (!measureText.has(label)) measureText.set(label, label.textContent);
        const value = `${Math.round(width)} × ${Math.round(height)} px`;
        if (label.textContent !== value) label.textContent = value;
      });
    };
    const settle = (section: Section) => {
      section.done = true;
      section.started = true;
      section.targets.forEach(element => { restore(element); completed.add(element); });
      section.cursors.forEach(cursor => { cursor.style.opacity = '0'; });
      section.element.classList.remove('is-rebuilding');
      report();
    };
    const finish = (section: Section) => {
      if (section.timeline && section.timeline.progress() < 1) section.timeline.progress(1);
      section.timeline?.pause();
      settle(section);
    };
    const finishAll = () => {
      finishedAll = true;
      sections.forEach(finish);
    };

    const begin = contextSafe!((section: Section) => {
      if (disposed || section.started || section.done) return;
      section.started = true;
      section.element.classList.add('is-rebuilding');
      const bounds = section.element.getBoundingClientRect();
      const plan = createBuildPlan(section.targets.map(element => ({ kind: element.dataset.build as BuildKind, text: element.dataset.buildText || element.textContent || '' })));
      const timeline = gsap.timeline({ paused: true, onComplete: () => settle(section) });
      section.timeline = timeline;
      plan.forEach(task => {
        const element = section.targets[task.index];
        const cursor = section.cursors.find(item => item.dataset.buildCursor === String(task.lane));
        const rect = element.getBoundingClientRect();
        const direction = task.lane === 1 ? -1 : 1;
        const offset = Math.min(76, bounds.width * .09) * direction;
        const origin = cursorPoint(rect.left - bounds.left + Math.min(rect.width * .75, 130), rect.top - bounds.top + 12, bounds.width, bounds.height);
        const approach = cursorPoint(origin.x + offset, origin.y + 32, bounds.width, bounds.height);
        const base = getComputedStyle(element).transform;
        const kind = element.dataset.build;
        const glyphs = kind === 'type' ? Array.from(element.querySelectorAll<HTMLElement>('[data-build-glyph]')) : [];
        const driver = { value: 0 };
        save(element);
        glyphs.forEach(save);
        measure(element);
        if (cursor) {
          const destination = cursorPoint(origin.x + (kind === 'type' ? 48 : 0), origin.y - 4, bounds.width, bounds.height);
          save(cursor);
          timeline.set(cursor, { x: approach.x, y: approach.y, opacity: 0 }, task.start);
          timeline.to(cursor, { x: origin.x, y: origin.y, opacity: 1, duration: .24, ease: 'power2.out' }, task.start);
          timeline.to(cursor, { x: destination.x, y: destination.y, duration: task.duration - .15, ease: 'none' }, task.start + .2);
          timeline.to(cursor, { opacity: 0, duration: .13 }, task.start + task.duration);
        }
        timeline.to(driver, {
          value: 1,
          duration: task.duration,
          ease: kind === 'type' ? `steps(${task.steps})` : 'power3.out',
          onStart: () => {
            element.classList.add('is-building');
            glyphs.forEach(glyph => { glyph.style.opacity = '0'; });
          },
          onUpdate: () => {
            if (!element.isConnected) return;
            const p = driver.value;
            if (kind === 'type' && glyphs.length) {
              const count = Math.floor(p * glyphs.length + .00001);
              glyphs.forEach((glyph, index) => { glyph.style.opacity = index < count ? '1' : '0'; });
            }
            else if (kind === 'type') element.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
            else {
              element.style.opacity = String(.35 + p * .65);
              const x = kind === 'place' ? offset * (1 - p) : 0;
              const y = kind === 'place' ? 30 * (1 - p) : 0;
              const rotate = kind === 'place' ? direction * 3 * (1 - p) : 0;
              element.style.transform = `translate(${x}px,${y}px) rotate(${rotate}deg) scale(${.96 + p * .04}) ${base === 'none' ? '' : base}`;
            }
          },
          onComplete: () => { restore(element); completed.add(element); report(); },
        }, task.start + .12);
      });
      if (!latest.current.paused && !document.hidden && section.visible) timeline.play();
    });

    const sync = () => {
      if (disposed) return;
      if (latest.current.skip || latest.current.reduced || finishedAll) { finishAll(); return; }
      sections.forEach(section => {
        if (section.element.closest('[hidden]')) { section.visible = false; if (!section.done) finish(section); }
        else if (!section.visible || document.hidden || latest.current.paused) section.timeline?.pause();
        else if (!section.done) {
          if (!section.started) begin(section);
          section.timeline?.play();
        }
      });
    };
    const collect = () => {
      sections.forEach(section => {
        const targets = Array.from(section.element.querySelectorAll<HTMLElement>('[data-build]')).filter(element => element.closest('[data-build-section]') === section.element);
        const changed = targets.length !== section.targets.length || targets.some((element, index) => element !== section.targets[index]);
        if (!changed) {
          if (section.element.closest('[hidden]') && !section.done) { section.visible = false; finish(section); }
          return;
        }
        // A filter or a React content update should never replay/re-hide the live content.
        if (section.started) finish(section);
        section.targets = targets;
        section.targets.forEach(measure);
        if (section.started || finishedAll || section.element.closest('[hidden]')) finish(section);
      });
      report();
      sync();
    };
    collect();
    sections.forEach(section => {
      section.cursors.forEach(cursor => { save(cursor); cursor.style.opacity = '0'; });
    });
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const section = sections.find(item => item.element === entry.target);
        if (section) section.visible = entry.isIntersecting && !section.element.closest('[hidden]');
      });
      sync();
    }, { threshold: 0, rootMargin: '-7% 0px -10% 0px' });
    sections.forEach(section => observer?.observe(section.element));
    const checkViewport = () => {
      sections.forEach(section => {
        const bounds = section.element.getBoundingClientRect();
        section.visible = !section.element.closest('[hidden]') && bounds.width > 0 && bounds.height > 0 && bounds.top < innerHeight * .9 && bounds.bottom > innerHeight * .07;
      });
      sync();
    };
    checkViewport();
    if (!observer) window.addEventListener('scroll', checkViewport, { passive: true });
    const resize = () => {
      // Coordinates are measured per entrance; complete an active layout before resizing.
      sections.filter(section => section.started && !section.done).forEach(finish);
      sections.forEach(section => section.targets.forEach(measure));
      checkViewport();
    };
    const interact = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const owner = target.closest('[data-build-section]');
      const section = sections.find(item => item.element === owner);
      if (section) finish(section);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') finishAll(); };
    const mutations = new MutationObserver(collect);
    mutations.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    document.fonts.ready.then(() => {
      if (!disposed) sections.forEach(section => section.targets.forEach(measure));
    });
    host.addEventListener('focusin', interact);
    host.addEventListener('pointerdown', interact, { passive: true });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', escape);
    controls.current = { sync, finish: finishAll };
    return () => {
      disposed = true;
      controls.current = null;
      observer?.disconnect();
      mutations.disconnect();
      sections.forEach(section => { section.timeline?.kill(); section.element.classList.remove('is-rebuilding'); });
      snapshots.forEach((_value, element) => restore(element));
      measureText.forEach((value, label) => { if (label.isConnected) label.textContent = value; });
      host.removeEventListener('focusin', interact);
      host.removeEventListener('pointerdown', interact);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', checkViewport);
    };
  }, { scope: root, dependencies: [options.reduced, options.replay], revertOnUpdate: true });

  useEffect(() => { controls.current?.sync(); }, [options.paused, options.skip]);
}
