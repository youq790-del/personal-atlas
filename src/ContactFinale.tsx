import { useId, useRef, useState, type CSSProperties } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { wechatLink, type WeChatCollection } from './wechat';
import './contact-finale.css';

const alphabet = ['?', '∫', '+', ':', '×', '{', '}', '→', '·', '∑', '/', '7'];
const marks = Array.from({ length: 132 }, (_, i) => {
  const angle = i * 2.399963;
  const ring = .76 + (i % 7) * .036;
  return { glyph: alphabet[i % alphabet.length], x: 50 + Math.cos(angle) * ring * 48, y: 50 + Math.sin(angle) * ring * 43, turn: Math.sin(i * 1.7) * 65, size: 17 + (i * 13 % 27), color: i % 13 === 0 ? '#f6dc57' : i % 9 === 0 ? '#ff90b4' : '#f4f2ff' };
});

/** A field of movable type: semantic controls sit above the decorative glyphs. */
export function ContactFinale({ name, collection, email, reduced, onRead }: { name: string; collection?: WeChatCollection; email?: string; reduced: boolean; onRead: () => void }) {
  const root = useRef<HTMLElement>(null), field = useRef<HTMLDivElement>(null);
  const impulse = useRef<() => void>(() => {});
  const [open, setOpen] = useState(false), [notice, setNotice] = useState('');
  const titleId = useId();
  const account = collection?.accountId;
  const home = wechatLink(collection?.homeUrl, 'home');
  useGSAP(() => {
    const element = root.current, surface = field.current;
    if (!element || !surface || reduced) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = Array.from(surface.children) as HTMLElement[];
    const particles = nodes.map((el, i) => ({ el, x: 0, y: 0, vx: 0, vy: 0, spin: 0, shown: true, base: marks[i] }));
    const word = element.querySelector<HTMLElement>('.finale-word');
    let width = 1, height = 1, visible = false, running = false, energy = 0;
    let top = 0, left = 0, scrollForce = 0, lastScroll = scrollY, lastTime = performance.now();
    const pointer = { x: -1000, y: -1000, active: false };
    const enabled = () => visible && !document.hidden && !preference.matches && !document.querySelector('dialog[open]');
    const stop = () => { gsap.ticker.remove(tick); running = false; };
    const reset = () => {
      stop(); scrollForce = 0;
      particles.forEach(p => { p.x = p.y = p.vx = p.vy = p.spin = 0; p.el.style.removeProperty('transform'); });
      word?.style.removeProperty('transform');
    };
    const tick = (_t: number, delta: number) => {
      if (!enabled()) { stop(); return; }
      const dt = Math.min(delta / 16.667, 1.7);
      let movement = 0;
      scrollForce *= Math.pow(.89, dt);
      for (const p of particles) {
        if (!p.shown) continue;
        const ax = p.base.x / 100 * width, ay = p.base.y / 100 * height;
        const dx = ax + p.x - pointer.x, dy = ay + p.y - pointer.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        if (pointer.active && distance < 155) {
          const push = (1 - distance / 155) * 2.4;
          p.vx += dx / distance * push * dt; p.vy += dy / distance * push * dt;
          p.spin += push * (p.base.x > 50 ? 1 : -1);
        }
        const stretch = (ay - height / 2) * scrollForce * .09;
        p.vx += -p.x * .016 * dt; p.vy += (stretch - p.y) * .016 * dt;
        p.vx *= Math.pow(.86, dt); p.vy *= Math.pow(.86, dt);
        p.x = Math.max(-160, Math.min(160, p.x + p.vx * dt));
        p.y = Math.max(-140, Math.min(140, p.y + p.vy * dt));
        p.spin *= Math.pow(.95, dt);
        p.el.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) rotate(${(p.base.turn + p.spin).toFixed(1)}deg)`;
        movement += Math.abs(p.vx) + Math.abs(p.vy);
      }
      if (word) word.style.transform = `scale(${1 - Math.abs(scrollForce) * .025},${1 + scrollForce * .06})`;
      energy--;
      if (energy <= 0 && movement < .8 && Math.abs(scrollForce) < .002) stop();
    };
    const wake = () => { energy = 120; if (enabled() && !running) { running = true; gsap.ticker.add(tick); } };
    const measure = () => { const box = surface.getBoundingClientRect(); width = box.width; height = box.height; top = box.top; left = box.left; };
    const move = (event: PointerEvent) => {
      if (!enabled()) return;
      pointer.x = event.clientX - left; pointer.y = event.clientY - top; pointer.active = true; wake();
    };
    const leave = () => { pointer.active = false; wake(); };
    const scatter = () => {
      if (!enabled()) return;
      pointer.active = false;
      for (const p of particles) {
        const angle = Math.atan2(p.base.y - 50, p.base.x - 50);
        p.vx += Math.cos(angle) * 15; p.vy += Math.sin(angle) * 15; p.spin += (p.base.x - 50) * 2;
      }
      wake();
    };
    impulse.current = scatter;
    const scroll = () => { measure(); const now = performance.now(); scrollForce = gsap.utils.clamp(-1, 1, (scrollY - lastScroll) / Math.max(16, now - lastTime) * .55); lastScroll = scrollY; lastTime = now; wake(); };
    const sync = () => { if (!enabled()) reset(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; measure(); sync(); }, { threshold: .04 });
    observer.observe(element);
    const resize = new ResizeObserver(() => { measure(); particles.forEach(p => { p.shown = getComputedStyle(p.el).display !== 'none'; }); reset(); }); resize.observe(surface);
    element.addEventListener('pointermove', move, { passive: true }); element.addEventListener('pointerleave', leave); element.addEventListener('pointerdown', scatter);
    window.addEventListener('scroll', scroll, { passive: true }); document.addEventListener('visibilitychange', sync); preference.addEventListener('change', sync);
    measure();
    return () => { reset(); impulse.current = () => {}; observer.disconnect(); resize.disconnect(); element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave); element.removeEventListener('pointerdown', scatter); window.removeEventListener('scroll', scroll); document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', sync); };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });
  const copy = async () => {
    if (!account) return;
    try { await navigator.clipboard.writeText(account); setNotice('已复制。到微信里搜一下。'); }
    catch { setNotice(`在微信里搜索 ${account}`); }
  };
  return <section id="contact" ref={root} className={`contact-finale ${reduced ? 'finale-still' : ''}`} aria-labelledby={titleId}>
    <div className="finale-type-field" ref={field} aria-hidden="true">{marks.map((mark, i) => <span key={i} style={{ left: `${mark.x}%`, top: `${mark.y}%`, '--turn': `${mark.turn}deg`, '--glyph-size': `${mark.size}px`, color: mark.color } as CSSProperties}>{mark.glyph}</span>)}</div>
    <div className="finale-center">
      <h2 id={titleId} className="finale-word">聊聊<span>？</span></h2>
      <button className="finale-contact-button" onClick={() => setOpen(true)} aria-haspopup="dialog"><span>找到我</span><Icon name="arrow-right-up-linear" size={24}/></button>
    </div>
    <button className="finale-scatter" onClick={() => impulse.current()} aria-label="拨散字符，再让它们归位"><Icon name="refresh-linear" size={17}/><span>拨一拨</span></button>
    <div className="finale-register" aria-hidden="true"><span>+</span><span>+</span></div>
    {open && <Modal title={`找到 ${name}`} onClose={() => setOpen(false)} className="contact-reveal">
      <p className="contact-reveal-label">微信公众号</p><p className="contact-reveal-name">{collection?.name || '公众号'}</p>
      {account && <button className="contact-reveal-account" onClick={copy}><span>{account}</span><Icon name="copy-linear" size={20}/></button>}
      <p className="contact-reveal-status" role="status">{notice || (account ? '点一下，复制账号。' : '可以先读读我的笔记。')}</p>
      <div className="contact-reveal-links"><button onClick={() => { setOpen(false); onRead(); }}>读笔记<Icon name="arrow-right-up-linear" size={18}/></button>{home && <a href={home} target="_blank" rel="noopener noreferrer">微信原文<Icon name="arrow-right-up-linear" size={18}/></a>}{email && <a href={`mailto:${encodeURIComponent(email)}`}>写邮件<Icon name="arrow-right-up-linear" size={18}/></a>}</div>
    </Modal>}
  </section>;
}
