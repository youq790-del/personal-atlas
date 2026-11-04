import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

/** A contour drawing that bends locally under contact; no continuous idle motion. */
export function FieldBackdrop({ disabled = false }: { disabled?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useGSAP(() => {
    const element = host.current, surface = canvas.current;
    if (!element || !surface) return;
    const context = surface.getContext('2d');
    if (!context) return;
    let width = 1, height = 1, visible = false, awake = 0, running = false;
    let scrollForce = 0, lastScroll = scrollY, lastScrollTime = performance.now();
    let x = -500, y = -500, power = 0, speed = 0;
    const pointer = { x: -500, y: -500, active: false };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const count = width < 600 ? 27 : 46;
      const reach = Math.min(width * .36, 260);
      for (let line = 0; line < count; line++) {
        const u = line / (count - 1);
        context.beginPath();
        for (let sample = 0; sample <= 60; sample++) {
          const v = sample / 60;
          const bend = Math.sin(v * 6.5 + u * 2.1);
          let px = (u * 1.45 - .22) * width + bend * width * .17;
          let py = v * (height + 120) - 60;
          px += Math.sin(v * 12 - u * 4) * 19;
          const dx = px - x, dy = py - y, distance = Math.hypot(dx, dy);
          const force = Math.exp(-(distance * distance) / (reach * reach)) * power;
          px += dx * force * .38;
          py += dy * force * .28 + Math.sin(u * 8 + v * 9) * scrollForce * 24;
          if (sample === 0) context.moveTo(px, py); else context.lineTo(px, py);
        }
        context.strokeStyle = line % 5 === 0 ? 'rgba(53,76,171,.18)' : 'rgba(67,88,132,.075)';
        context.lineWidth = line % 5 === 0 ? .85 : .65;
        context.stroke();
      }
    };
    const resize = () => {
      width = element.clientWidth; height = innerHeight;
      const ratio = Math.min(devicePixelRatio, 1.5);
      surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(); awake = 70;
    };
    const tick = (_time: number, delta: number) => {
      if (awake <= 0) return;
      awake--;
      const dt = Math.min(2, delta / 16.667);
      x += (pointer.x - x) * Math.min(1, .14 * dt);
      y += (pointer.y - y) * Math.min(1, .14 * dt);
      speed = (speed + ((pointer.active ? 1 : 0) - power) * .1 * dt) * Math.pow(.72, dt);
      power += speed * dt;
      scrollForce *= Math.pow(.9, dt);
      draw();
    };
    const sync = () => {
      const next = visible && !document.hidden && !disabled;
      if (next && !running) { running = true; awake = 70; lastScroll = scrollY; gsap.ticker.add(tick); }
      else if (!next && running) { running = false; gsap.ticker.remove(tick); power = 0; scrollForce = 0; draw(); }
    };
    const move = (event: PointerEvent) => {
      if (!running) return;
      const bounds = element.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left; pointer.y = event.clientY - surface.getBoundingClientRect().top;
      pointer.active = !document.querySelector('dialog[open]') && !((event.target as Element)?.closest('.wechat-reading'));
      awake = 100;
    };
    const leave = () => { pointer.active = false; awake = 90; };
    const scroll = () => {
      const now = performance.now();
      if (running) { scrollForce = Math.max(-1, Math.min(1, (scrollY - lastScroll) / Math.max(16, now - lastScrollTime) * .5)); awake = 90; }
      lastScroll = scrollY; lastScrollTime = now;
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    resize(); element.dataset.ready = 'true';
    window.addEventListener('resize', resize);
    element.parentElement?.addEventListener('pointermove', move, { passive: true });
    element.parentElement?.addEventListener('pointerleave', leave);
    window.addEventListener('pointerup', leave);
    window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect(); gsap.ticker.remove(tick);
      window.removeEventListener('resize', resize);
      element.parentElement?.removeEventListener('pointermove', move);
      element.parentElement?.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerup', leave);
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('visibilitychange', sync);
    };
  }, { scope: host, dependencies: [disabled], revertOnUpdate: true });

  return <div className="field-backdrop" ref={host} aria-hidden="true">
    <svg className="field-poster" viewBox="0 0 1000 800" preserveAspectRatio="none">{Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${i * 42 - 150} -50 C${i * 42 + 300} 260 ${i * 42 - 300} 550 ${i * 42 + 60} 850`} />)}</svg>
    <canvas ref={canvas} />
  </div>;
}
