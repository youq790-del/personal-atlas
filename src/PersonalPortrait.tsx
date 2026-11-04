import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ElasticFrame } from './ElasticFrame';
import { Icon } from './Icon';
import { workAsset, workById, type WorkId } from './portfolio';
import './personal-portrait.css';

gsap.registerPlugin(useGSAP);

type Props = {
  reduced: boolean;
  onOpenWork: (id: WorkId) => void;
  onReadArticle: (id: string) => void;
};
const perspectives = [
  {
    label: '在学', word: '学习笔记',
    description: '物理、C++、材料力学。学到哪，就写到哪。',
    quote: '为什么能量往往与某个物理量的平方有关？',
    article: '波', articleId: 'writing-a06', action: '看笔记',
    main: 'grass' as WorkId, second: 'liquid' as WorkId,
  },
  {
    label: 'Blender', word: 'Blender 练习',
    description: '草地、玻璃、云，还有一些动画。',
    quote: '', article: '', articleId: '', action: '打开玻璃练习',
    actionWork: 'liquid' as WorkId,
    main: 'liquid' as WorkId, second: 'grass' as WorkId,
  },
  {
    label: '日常', word: '课外',
    description: '打羽毛球，也看剧。偶尔写进笔记末尾。',
    quote: '终于找到早7来打羽毛球的搭子了呀',
    article: '波', articleId: 'writing-a06', action: '看日记',
    main: 'grass' as WorkId, second: 'liquid' as WorkId,
  },
];

function wavePath(line: number, focus = .5, force = 0) {
  return Array.from({ length: 101 }, (_, i) => {
    const x = i * 6.4;
    const envelope = Math.sin(Math.PI * i / 100);
    const wave = Math.sin(x / 43 + line * .4) * (20 + line * 4) * envelope;
    const touch = Math.exp(-Math.pow(i / 100 - focus, 2) / .035) * force;
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(100 + wave + touch).toFixed(2)}`;
  }).join(' ');
}

/** A short portrait drawn from supplied works and the author's archived writing. */
export function PersonalPortrait({ reduced, onOpenWork, onReadArticle }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const wave = useRef<SVGSVGElement>(null);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const id = useId().replace(/:/g, '');
  const perspective = perspectives[active];
  const mainWork = workById(perspective.main)!;
  const secondWork = workById(perspective.second)!;

  useGSAP(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced || preference.matches) return;
    const reveals = root.current?.querySelectorAll('.portrait-media-reveal');
    const copy = root.current?.querySelector('.portrait-view-copy');
    const caption = root.current?.querySelectorAll('.portrait-work-label');
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (reveals) timeline.fromTo(reveals, { clipPath: 'inset(0% 0% 100% 0%)', rotation: active === 1 ? 7 : -5, scale: 1.12 }, { clipPath: 'inset(0% 0% 0% 0%)', rotation: 0, scale: 1, duration: .95, stagger: .09 }, 0);
    if (copy) timeline.fromTo(copy, { y: 16, opacity: .1 }, { y: 0, opacity: 1, duration: .65 }, .12);
    if (caption) timeline.fromTo(caption, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, .25);
    const stop = () => { if (document.hidden || preference.matches) timeline.progress(1); };
    document.addEventListener('visibilitychange', stop);
    preference.addEventListener('change', stop);
    return () => { document.removeEventListener('visibilitychange', stop); preference.removeEventListener('change', stop); };
  }, { scope: root, dependencies: [active, reduced], revertOnUpdate: true });

  useGSAP(() => {
    const element = root.current;
    const drawing = wave.current;
    if (!element || !drawing || reduced) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paths = Array.from(drawing.querySelectorAll('path'));
    const main = element.querySelector<HTMLElement>('.portrait-main-float');
    const secondary = element.querySelector<HTMLElement>('.portrait-secondary-float');
    let visible = false, running = false;
    let focus = .5, force = 0, targetForce = 0, velocity = 0;
    let x = 0, y = 0, tx = 0, ty = 0;
    const enabled = () => visible && !document.hidden && !preference.matches;
    const paint = () => paths.forEach((path, index) => path.setAttribute('d', wavePath(index, focus, force)));
    const stop = () => { gsap.ticker.remove(tick); running = false; };
    const reset = () => {
      stop(); force = targetForce = velocity = x = y = tx = ty = 0;
      paint(); main?.style.removeProperty('transform'); secondary?.style.removeProperty('transform');
    };
    const tick = (_time: number, delta: number) => {
      if (!enabled()) { reset(); return; }
      const dt = Math.min(delta / 16.667, 2);
      velocity = (velocity + (targetForce - force) * .105 * dt) * Math.pow(.78, dt);
      force += velocity * dt;
      x += (tx - x) * .075 * dt; y += (ty - y) * .075 * dt;
      paint();
      if (main) main.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      if (secondary) secondary.style.transform = `translate3d(${(-x * .8).toFixed(2)}px,${(-y * .65).toFixed(2)}px,0)`;
      if (Math.abs(force - targetForce) + Math.abs(velocity) + Math.abs(x - tx) + Math.abs(y - ty) < .025) stop();
    };
    const wake = () => { if (enabled() && !running) { running = true; gsap.ticker.add(tick); } };
    const move = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === 'touch') return;
      const box = element.getBoundingClientRect();
      const waveBox = drawing.getBoundingClientRect();
      tx = ((event.clientX - box.left) / box.width - .5) * 17;
      ty = ((event.clientY - box.top) / box.height - .5) * 13;
      focus = gsap.utils.clamp(0, 1, (event.clientX - waveBox.left) / waveBox.width);
      const distance = event.clientY - (waveBox.top + waveBox.height * .5);
      targetForce = Math.abs(distance) < 110 ? gsap.utils.clamp(-28, 28, distance * .5) : 0;
      wake();
    };
    const release = () => { targetForce = tx = ty = 0; wake(); };
    const sync = () => { if (!enabled()) reset(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .05 });
    observer.observe(element);
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', release);
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    return () => {
      observer.disconnect(); reset(); element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', release);
      document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', sync);
    };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  const changeTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % perspectives.length;
    else if (event.key === 'ArrowLeft') next = (index + perspectives.length - 1) % perspectives.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = perspectives.length - 1;
    else return;
    event.preventDefault(); setActive(next); tabButtons.current[next]?.focus();
  };

  return <div ref={root} className={`personal-portrait portrait-view-${active}${reduced ? ' portrait-is-still' : ''}`}>
    <div className="portrait-heading">
      <h2>关于我。</h2>
      <p>理工科在读。<br/>写笔记，也学着做图。</p>
    </div>
    <div className="portrait-perspectives" role="tablist" aria-label="认识 yo7 的三个侧面">{perspectives.map((item, index) => <button
      key={item.label} ref={element => { tabButtons.current[index] = element; }} type="button" role="tab"
      id={`${id}-tab-${index}`} aria-controls={`${id}-panel`} aria-selected={active === index} tabIndex={active === index ? 0 : -1}
      onClick={() => setActive(index)} onKeyDown={event => changeTab(event, index)}
    ><span>{item.label}</span><span className="portrait-tab-dot" aria-hidden="true"/></button>)}</div>
    <div className="portrait-composition" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} tabIndex={0}>
      <div className="portrait-main-float">
        <button className="portrait-work portrait-main-work" type="button" onClick={() => onOpenWork(mainWork.id)} aria-label={`打开 Blender 练习：${mainWork.title}`}>
          <div className="portrait-main-window"><ElasticFrame variant={active === 1 ? 4 : 2} disabled={reduced}>
            <div className="portrait-media-reveal"><img src={workAsset(mainWork.poster)} alt={`${mainWork.title}：${mainWork.caption}`} width={900} height={900} loading="lazy" decoding="async"/></div>
          </ElasticFrame></div>
          <span className="portrait-work-label"><span>{mainWork.title}<small>{mainWork.caption}</small></span><Icon name="arrow-right-up-linear" size={24}/></span>
        </button>
      </div>
      <div className="portrait-view-copy" key={active}>
        <h3>{perspective.word}</h3>
        <p>{perspective.description}</p>
        {perspective.quote && <blockquote><p>{perspective.quote}</p><cite>——《{perspective.article}》</cite></blockquote>}
        <button className="portrait-reading-link" type="button" onClick={() => perspective.actionWork ? onOpenWork(perspective.actionWork) : onReadArticle(perspective.articleId)}>{perspective.action}<Icon name="arrow-right-up-linear" size={18}/></button>
      </div>
      <svg ref={wave} className="portrait-wave" viewBox="0 0 640 200" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <path key={index} d={wavePath(index)}/>)}</svg>
      <div className="portrait-secondary-float">
        <button className="portrait-work portrait-secondary-work" type="button" onClick={() => onOpenWork(secondWork.id)} aria-label={`打开 Blender 练习：${secondWork.title}`}>
          <div className="portrait-secondary-window"><ElasticFrame variant={active === 1 ? 2 : 5} disabled={reduced}>
            <div className="portrait-media-reveal"><img src={workAsset(secondWork.poster)} alt={`${secondWork.title}：${secondWork.caption}`} width={600} height={600} loading="lazy" decoding="async"/></div>
          </ElasticFrame></div>
          <span className="portrait-work-label"><span>{secondWork.title}<small>Blender 练习</small></span><Icon name="arrow-right-up-linear" size={20}/></span>
        </button>
      </div>
      <span className="portrait-bridge" aria-hidden="true">文字 <span>⇄</span> 图像</span>
    </div>
  </div>;
}
