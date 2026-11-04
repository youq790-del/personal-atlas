import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Icon } from './Icon';
import type { WeChatArticle } from './wechat';
import './thinking-desk.css';

gsap.registerPlugin(useGSAP);

type TopicId = 'coffee' | 'paper' | 'wave';
type Topic = { id: TopicId; label: string; title: string; question: string; steps: { label: string; quote: string }[] };

// These are short, verbatim excerpts from the supplied published archive.
// The diagrams below are editorial models, not measurements of the author's experiment.
const topics: Topic[] = [
  { id: 'coffee', label: '咖啡', title: '如何在骑车的时候将袋子里的咖啡稳稳拿捏', question: '换成手提，就稳了？', steps: [
    { label: '观察', quote: '用手拿袋子，竟然成功减小了晃动' },
    { label: '猜测', quote: '但换成手提，改变的其实不只是阻尼。' },
    { label: '未确定', quote: '光凭肉眼观察其实还无法确定。' },
  ] },
  { id: 'paper', label: '滤纸', title: 'breaking bad', question: '为什么偏偏是马鞍面？', steps: [
    { label: '观察', quote: '但单独滤纸重复操作并不会产生如此大的弯折' },
    { label: '猜测', quote: '这种毛细作用可能促使颗粒彼此靠近，使沉积层收缩' },
    { label: '未确定', quote: '但可能在抽滤的过程中，颗粒沉积量按照了一定的方式中间高，两边低' },
  ] },
  { id: 'wave', label: '波', title: '波', question: '怎么又是平方？', steps: [
    { label: '观察', quote: '这个平方结构难道有什么特殊性吗' },
    { label: '解释', quote: '在稳定平衡态附近，许多系统的能量其实是可以展开为二次型' },
    { label: '再问', quote: '我们研究介质的色散，但如果反过来，就可以通过设计材料结构，制造自己想要的色散关系' },
  ] },
];

/** Stop every moving model when it cannot be seen, or motion has been disabled. */
function useModelActivity(root: RefObject<HTMLElement | null>, reduced: boolean, hasContent: boolean) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => setActive(visible && !document.hidden && !reduced && !preference.matches);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .08 });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', sync); };
  }, [root, reduced, hasContent]);
  return active;
}

const waveY = (x: number, amplitude: number, phase: number) => 200 + Math.sin((x - 40) / 53 - phase) * amplitude * 95;
function wavePath(amplitude: number, phase: number) {
  return Array.from({ length: 141 }, (_, i) => {
    const x = 40 + i * 4;
    return `${i ? 'L' : 'M'}${x} ${waveY(x, amplitude, phase).toFixed(2)}`;
  }).join(' ');
}

function WaveModel({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const curve = useRef<SVGPathElement>(null);
  const points = useRef<(SVGCircleElement | null)[]>([]);
  const phase = useRef({ value: 0 });
  const amplitude = useRef(.55);
  const tween = useRef<gsap.core.Tween | null>(null);
  const [amount, setAmount] = useState(55);
  const { contextSafe } = useGSAP({ scope: root });
  const draw = useCallback(() => {
    curve.current?.setAttribute('d', wavePath(amplitude.current, phase.current.value));
    points.current.forEach((point, i) => point?.setAttribute('cy', waveY(40 + i * 560 / 30, amplitude.current, phase.current.value).toFixed(2)));
  }, []);
  const play = contextSafe(() => {
    tween.current?.kill();
    if (!active) { phase.current.value += Math.PI / 3; draw(); return; }
    tween.current = gsap.to(phase.current, { value: phase.current.value + Math.PI * 4, duration: 4.5, ease: 'none', onUpdate: draw });
  });
  useEffect(() => { if (!active) tween.current?.kill(); return () => { tween.current?.kill(); }; }, [active]);
  const change = (value: number) => { setAmount(value); amplitude.current = value / 100; draw(); };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    change(Math.round(gsap.utils.clamp(0, 100, Math.abs((event.clientY - rect.top) / rect.height * 400 - 200) / 95 * 100)));
  };
  return <div ref={root} className="thinking-model thinking-wave">
    <svg viewBox="0 0 640 400" aria-hidden="true" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(event); }} onPointerMove={move} onPointerUp={event => { event.currentTarget.releasePointerCapture(event.pointerId); play(); }}>
      <path className="thinking-guide" d="M40 200H600M320 85V315" />
      <path ref={curve} className="thinking-wave-line" d={wavePath(.55, 0)} />
      {Array.from({ length: 31 }, (_, i) => <circle key={i} ref={element => { points.current[i] = element; }} cx={40 + i * 560 / 30} cy={waveY(40 + i * 560 / 30, .55, 0)} r={i === 15 ? 8 : 3} className={i === 15 ? 'thinking-point-main' : 'thinking-point'} />)}
    </svg>
    <div className="thinking-model-controls">
      <button type="button" onClick={play}>拨一下 <Icon name="play-linear" size={16} /></button>
      <label>振幅<input type="range" min="0" max="100" value={amount} onChange={event => change(Number(event.target.value))} aria-label="调整波的振幅" /></label>
    </div>
    <span className="thinking-model-note">点只上下动。示意，非实测。</span>
  </div>;
}

function saddlePaths(bend: number) {
  const project = (x: number, y: number) => [320 + 103 * (x - y), 205 + 35 * (x + y) - 42 * bend * (x * x - y * y)];
  return Array.from({ length: 22 }, (_, line) => {
    const fixed = -1.35 + line % 11 * .27;
    return Array.from({ length: 61 }, (_, step) => {
      const variable = -1.35 + step * .045;
      const point = line < 11 ? project(fixed, variable) : project(variable, fixed);
      return `${step ? 'L' : 'M'}${point[0].toFixed(2)} ${point[1].toFixed(2)}`;
    }).join(' ');
  });
}

function PaperModel({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const shape = useRef({ bend: .7 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const [bend, setBend] = useState(70);
  const { contextSafe } = useGSAP({ scope: root });
  const draw = useCallback(() => saddlePaths(shape.current.bend).forEach((path, i) => lines.current[i]?.setAttribute('d', path)), []);
  const change = contextSafe((value: number) => {
    setBend(value); tween.current?.kill();
    if (!active) { shape.current.bend = value / 100; draw(); return; }
    tween.current = gsap.to(shape.current, { bend: value / 100, duration: .45, ease: 'power3.out', onUpdate: draw });
  });
  useEffect(() => { if (!active) tween.current?.progress(1); return () => { tween.current?.kill(); }; }, [active]);
  return <div ref={root} className="thinking-model thinking-paper">
    <svg viewBox="0 0 640 400" aria-hidden="true"><g>{saddlePaths(.7).map((path, i) => <path key={i} ref={element => { lines.current[i] = element; }} d={path} className={i === 5 || i === 16 ? 'thinking-mesh-main' : 'thinking-mesh'} />)}</g></svg>
    <div className="thinking-model-controls"><button type="button" onClick={() => change(bend === 0 ? 70 : 0)}>{bend === 0 ? '弯起来' : '展平'}<Icon name="refresh-linear" size={16} /></button><label>曲率<input type="range" min="-100" max="100" value={bend} onChange={event => change(Number(event.target.value))} aria-label="调整马鞍曲面的曲率" /></label></div>
    <span className="thinking-model-note">几何示意，不是材料模拟。</span>
  </div>;
}

function CoffeeModel({ active }: { active: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const string = useRef<SVGLineElement>(null), bob = useRef<SVGCircleElement>(null), pivot = useRef<SVGCircleElement>(null);
  const support = useRef<SVGPathElement>(null);
  const state = useRef({ angle: .4, velocity: 0, pivot: 0, dragging: '' });
  const wake = useRef<() => void>(() => {});
  const [mode, setMode] = useState<'bar' | 'hand'>('bar');
  const [angle, setAngle] = useState(23), [anchor, setAnchor] = useState(0);
  const draw = useCallback(() => {
    const s = state.current, px = 320 + s.pivot, py = 88, x = px + Math.sin(s.angle) * 215, y = py + Math.cos(s.angle) * 215;
    string.current?.setAttribute('x1', `${px}`); string.current?.setAttribute('x2', `${x}`); string.current?.setAttribute('y2', `${y}`);
    pivot.current?.setAttribute('cx', `${px}`); bob.current?.setAttribute('cx', `${x}`); bob.current?.setAttribute('cy', `${y}`);
    support.current?.setAttribute('d', mode === 'bar' ? `M${px - 70} 88H${px + 70}` : `M${px - 70} 88Q${px} 24 ${px + 70} 88`);
  }, [mode]);
  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    let running = false;
    const stop = () => { gsap.ticker.remove(tick); running = false; };
    const tick = (_time: number, delta: number) => {
      const s = state.current;
      if (!active || document.hidden || s.dragging) { stop(); return; }
      const dt = Math.min(2, delta / 16.667);
      s.velocity += (-.015 * Math.sin(s.angle) - .032 * s.velocity) * dt;
      s.angle = gsap.utils.clamp(-.95, .95, s.angle + s.velocity * dt);
      draw();
      if (Math.abs(s.angle) + Math.abs(s.velocity) < .001) { s.angle = s.velocity = 0; draw(); stop(); setAngle(0); }
    };
    wake.current = () => { if (active && !running) { gsap.ticker.add(tick); running = true; } };
    return () => { stop(); wake.current = () => {}; };
  }, [active, draw]);
  const start = (event: PointerEvent<SVGCircleElement>, part: 'bob' | 'pivot') => {
    event.preventDefault(); state.current.dragging = part; state.current.velocity = 0;
    svg.current?.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const s = state.current;
    if (!s.dragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 640, y = (event.clientY - rect.top) / rect.height * 400;
    if (s.dragging === 'pivot') {
      const next = gsap.utils.clamp(-100, 100, x - 320);
      s.velocity += (s.pivot - next) * .0015; s.pivot = next; setAnchor(Math.round(next));
    } else { s.angle = gsap.utils.clamp(-.95, .95, Math.atan2(x - 320 - s.pivot, y - 88)); setAngle(Math.round(s.angle * 180 / Math.PI)); }
    draw();
  };
  const end = (event: PointerEvent<SVGSVGElement>) => { state.current.dragging = ''; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); wake.current(); };
  return <div className="thinking-model thinking-coffee">
    <div className="thinking-hang-options" role="group" aria-label="悬挂方式示意"><button type="button" aria-pressed={mode === 'bar'} onClick={() => setMode('bar')}>车把</button><button type="button" aria-pressed={mode === 'hand'} onClick={() => setMode('hand')}>手提</button></div>
    <svg ref={svg} viewBox="0 0 640 400" aria-hidden="true" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <path className="thinking-guide" d="M320 88V340M105 303H535" />
      <path ref={support} className="thinking-support" d="M250 88H390" />
      <line ref={string} className="thinking-string" x1="320" y1="88" x2={320 + Math.sin(.4) * 215} y2={88 + Math.cos(.4) * 215} />
      <circle ref={pivot} className="thinking-pivot" cx="320" cy="88" r="11" onPointerDown={event => start(event, 'pivot')} />
      <circle ref={bob} className="thinking-bob" cx={320 + Math.sin(.4) * 215} cy={88 + Math.cos(.4) * 215} r="25" onPointerDown={event => start(event, 'bob')} />
    </svg>
    <div className="thinking-model-controls thinking-coffee-controls">
      <button type="button" onClick={() => { state.current.angle = .7; state.current.velocity = 0; setAngle(40); draw(); wake.current(); }}>拨一下 <Icon name="play-linear" size={16} /></button>
      <label>偏转<input type="range" min="-54" max="54" value={angle} onChange={event => { const value = Number(event.target.value); setAngle(value); state.current.angle = value * Math.PI / 180; state.current.velocity = 0; draw(); }} onKeyUp={() => wake.current()} onPointerUp={() => wake.current()} aria-label="调整摆球偏转角度" /></label>
      <label>挂点<input type="range" min="-100" max="100" value={anchor} onChange={event => { const value = Number(event.target.value); state.current.velocity += (state.current.pivot - value) * .0015; state.current.pivot = value; setAnchor(value); draw(); wake.current(); }} aria-label="移动悬挂点" /></label>
    </div>
    <span className="thinking-model-note">拖动圆点。示意，非实测。</span>
  </div>;
}

export function ThinkingDesk({ reduced, onRead, articles }: { reduced: boolean; onRead: (id: string) => void; articles: WeChatArticle[] }) {
  const root = useRef<HTMLElement>(null);
  const [topicId, setTopicId] = useState<TopicId>('coffee'), [step, setStep] = useState(0);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId().replace(/:/g, '');
  const available = useMemo(() => topics.flatMap(topic => { const article = articles.find(item => item.title.trim() === topic.title); return article ? [{ ...topic, article }] : []; }), [articles]);
  const topic = available.find(item => item.id === topicId) ?? available[0];
  const active = useModelActivity(root, reduced, available.length > 0);
  const related = useMemo(() => ['反方向的钟', '波', '光为什么沿直线传播'].flatMap(title => { const article = articles.find(item => item.title.trim() === title); return article ? [article] : []; }).sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? '')), [articles]);
  useGSAP(() => {
    if (!active) return;
    gsap.fromTo('.thinking-excerpt', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .45, ease: 'power3.out', clearProps: 'clipPath' });
  }, { scope: root, dependencies: [topic?.id, step, active], revertOnUpdate: true });
  const select = (next: TopicId) => { setTopicId(next); setStep(0); };
  const tabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % available.length;
    else if (event.key === 'ArrowLeft') next = (index + available.length - 1) % available.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = available.length - 1;
    else return;
    event.preventDefault(); select(available[next].id); tabButtons.current[next]?.focus();
  };
  if (!topic) return null;
  const currentStep = topic.steps[Math.min(step, topic.steps.length - 1)];
  return <section ref={root} className={`thinking-desk ${reduced ? 'thinking-is-still' : ''}`} aria-labelledby={`${id}-title`}>
    <header className="thinking-desk-heading"><h3 id={`${id}-title`}>几个问题。</h3><div className="thinking-topics" role="tablist" aria-label="选择一个问题">{available.map((item, index) => <button key={item.id} ref={element => { tabButtons.current[index] = element; }} type="button" role="tab" id={`${id}-${item.id}`} aria-controls={`${id}-panel`} aria-selected={topic.id === item.id} tabIndex={topic.id === item.id ? 0 : -1} onClick={() => select(item.id)} onKeyDown={event => tabKey(event, index)}>{item.label}<span aria-hidden="true" /></button>)}</div></header>
    <div className="thinking-composition" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${topic.id}`}>
      <div className="thinking-drawing" key={topic.id}>{topic.id === 'coffee' ? <CoffeeModel active={active} /> : topic.id === 'paper' ? <PaperModel active={active} /> : <WaveModel active={active} />}</div>
      <div className="thinking-margin">
        <h4>{topic.question}</h4>
        <div className="thinking-steps" role="group" aria-label="查看思考过程">{topic.steps.map((item, index) => <button key={item.label} type="button" aria-pressed={step === index} onClick={() => setStep(index)}><span className="thinking-step-dot" aria-hidden="true" />{item.label}</button>)}</div>
        <div className="thinking-excerpt" aria-live="polite"><blockquote>“{currentStep.quote}”</blockquote><button className="thinking-read" type="button" onClick={() => onRead(topic.article.id)} aria-label={`阅读原文：${topic.article.title}`}>原文 <Icon name="arrow-right-up-linear" size={18} /></button></div>
      </div>
    </div>
    {related.length > 1 && <nav className="thinking-reading-thread" aria-label="按日期排列的振动与波相关文章"><span>按日期读：振动与波</span><div>{related.map((article, index) => <span key={article.id}>{index > 0 && <Icon name="arrow-right-linear" size={16} />}<button type="button" onClick={() => onRead(article.id)}><small>{article.publishedAt?.slice(5).replace('-', '.')}</small>{article.title}</button></span>)}</div></nav>}
  </section>;
}
